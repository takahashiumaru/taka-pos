import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { HttpError } from "@/server/http";
import { parseJsonBody, parseSearchParams } from "@/server/validate";
import { authed } from "@/server/handler";

const listSchema = z.object({
  q: z.string().optional(),
  userId: z.string().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "QRIS", "TRANSFER"]).optional(),
  status: z.enum(["PAID", "VOID"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(100),
});

const createSchema = z.object({
  customerId: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().min(1),
        discount: z.number().int().min(0).default(0),
      })
    )
    .min(1),
  discount: z.number().int().min(0).default(0),
  paymentMethod: z.enum(["CASH", "CARD", "QRIS", "TRANSFER"]),
  cashReceived: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

async function generateInvoiceId(): Promise<string> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const datePart = `${yyyy}${mm}${dd}`;
  const prefix = `INV-${datePart}-`;
  const last = await prisma.transaction.findFirst({
    where: { id: { startsWith: prefix } },
    orderBy: { id: "desc" },
    select: { id: true },
  });
  const lastN = last ? parseInt(last.id.split("-")[2] ?? "0", 10) : 0;
  return `${prefix}${String(lastN + 1).padStart(4, "0")}`;
}

export const GET = authed(async (req) => {
  const q = parseSearchParams(listSchema, req);
  const where = {
    ...(q.q
      ? { OR: [{ id: { contains: q.q } }, { customer: { name: { contains: q.q } } }] }
      : {}),
    ...(q.userId ? { userId: q.userId } : {}),
    ...(q.paymentMethod ? { paymentMethod: q.paymentMethod } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.from || q.to
      ? {
          createdAt: {
            ...(q.from ? { gte: new Date(q.from) } : {}),
            ...(q.to ? { lte: new Date(q.to) } : {}),
          },
        }
      : {}),
  };
  const [total, data] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return NextResponse.json({ data, total, page: q.page, pageSize: q.pageSize });
});

export const POST = authed(async (req, _ctx, user) => {
  const body = await parseJsonBody(createSchema, req);
  const productIds = body.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new HttpError(400, `Product not found: ${item.productId}`);
    if (!product.active) throw new HttpError(400, `Product inactive: ${product.name}`);
    if (product.stock < item.qty) {
      throw new HttpError(
        400,
        `Stok tidak cukup untuk ${product.name} (tersedia ${product.stock}, butuh ${item.qty})`
      );
    }
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const taxRate = settings?.taxRate ?? 0.11;

  const itemsData = body.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const lineGross = product.price * item.qty;
    const lineSubtotal = Math.max(0, lineGross - item.discount);
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: item.qty,
      discount: item.discount,
      subtotal: lineSubtotal,
    };
  });

  const subtotal = itemsData.reduce((acc, it) => acc + it.subtotal, 0);
  const afterDiscount = Math.max(0, subtotal - body.discount);
  const tax = Math.round(afterDiscount * taxRate);
  const total = afterDiscount + tax;

  if (body.paymentMethod === "CASH") {
    if (body.cashReceived == null || body.cashReceived < total) {
      throw new HttpError(400, "Tunai yang diterima harus >= total");
    }
  }

  const change =
    body.paymentMethod === "CASH" && body.cashReceived != null ? body.cashReceived - total : null;
  const invoiceId = await generateInvoiceId();

  const created = await prisma.$transaction(async (tx) => {
    const txn = await tx.transaction.create({
      data: {
        id: invoiceId,
        userId: user.id,
        customerId: body.customerId ?? null,
        subtotal,
        discount: body.discount,
        tax,
        total,
        paymentMethod: body.paymentMethod,
        cashReceived: body.cashReceived ?? null,
        changeAmount: change,
        notes: body.notes ?? null,
        status: "PAID",
        items: { create: itemsData },
      },
      include: {
        items: true,
        user: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    for (const item of itemsData) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          type: "OUT",
          qty: -item.qty,
          reason: "Sale",
          refInvoice: invoiceId,
          userId: user.id,
        },
      });
    }

    return txn;
  });

  return NextResponse.json({ data: created }, { status: 201 });
});
