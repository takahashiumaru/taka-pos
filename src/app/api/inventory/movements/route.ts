import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { HttpError } from "@/server/http";
import { parseJsonBody, parseSearchParams } from "@/server/validate";
import { authed } from "@/server/handler";

const listSchema = z.object({
  productId: z.string().optional(),
  type: z.enum(["IN", "OUT", "ADJUST"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200),
});

const createSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  qty: z.number().int(),
  reason: z.string().max(200).nullable().optional(),
  refInvoice: z.string().max(50).nullable().optional(),
});

export const GET = authed(async (req) => {
  const q = parseSearchParams(listSchema, req);
  const where = {
    ...(q.productId ? { productId: q.productId } : {}),
    ...(q.type ? { type: q.type } : {}),
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
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, barcode: true } },
        user: { select: { id: true, name: true } },
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
  const product = await prisma.product.findUnique({ where: { id: body.productId } });
  if (!product) throw new HttpError(404, "Product not found");

  let deltaStock = 0;
  let recordedQty = body.qty;

  if (body.type === "IN") {
    if (body.qty <= 0) throw new HttpError(400, "IN qty must be positive");
    deltaStock = body.qty;
  } else if (body.type === "OUT") {
    if (body.qty <= 0) throw new HttpError(400, "OUT qty must be positive");
    deltaStock = -body.qty;
    recordedQty = -body.qty;
  } else {
    if (body.qty < 0) throw new HttpError(400, "ADJUST qty cannot be negative");
    deltaStock = body.qty - product.stock;
    recordedQty = deltaStock;
  }

  const [movement, updatedProduct] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: {
        productId: body.productId,
        type: body.type,
        qty: recordedQty,
        reason: body.reason ?? null,
        refInvoice: body.refInvoice ?? null,
        userId: user.id,
      },
    }),
    prisma.product.update({
      where: { id: body.productId },
      data: { stock: { increment: deltaStock } },
    }),
  ]);

  return NextResponse.json({ data: movement, product: updatedProduct }, { status: 201 });
});
