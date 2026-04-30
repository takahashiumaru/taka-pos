import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { HttpError } from "@/server/http";
import { parseJsonBody } from "@/server/validate";
import { authed } from "@/server/handler";

const updateSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  barcode: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().int().min(0).optional(),
  cost: z.number().int().min(0).optional(),
  unit: z.string().max(20).optional(),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  imageBase64: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export const GET = authed(async (_req, { params }) => {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { category: true },
  });
  if (!product) throw new HttpError(404, "Product not found");
  return NextResponse.json({ data: product });
});

export const PUT = authed(
  async (req, { params }) => {
    const body = await parseJsonBody(updateSchema, req);
    const updated = await prisma.product.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ data: updated });
  },
  ["ADMIN", "MANAGER"]
);

export const DELETE = authed(
  async (_req, { params }) => {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  },
  ["ADMIN"]
);
