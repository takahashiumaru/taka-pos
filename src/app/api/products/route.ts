import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseJsonBody, parseSearchParams } from "@/server/validate";
import { authed } from "@/server/handler";

const listSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  active: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(200),
});

const createSchema = z.object({
  sku: z.string().min(1).max(50),
  barcode: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().int().min(0),
  cost: z.number().int().min(0).default(0),
  unit: z.string().max(20).default("pcs"),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  imageBase64: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export const GET = authed(async (req) => {
  const q = parseSearchParams(listSchema, req);
  const where = {
    ...(q.q
      ? {
          OR: [
            { name: { contains: q.q } },
            { sku: { contains: q.q } },
            { barcode: { contains: q.q } },
          ],
        }
      : {}),
    ...(q.categoryId ? { categoryId: q.categoryId } : {}),
    ...(q.active ? { active: q.active === "true" } : {}),
  };
  const [total, data] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return NextResponse.json({ data, total, page: q.page, pageSize: q.pageSize });
});

export const POST = authed(
  async (req) => {
    const body = await parseJsonBody(createSchema, req);
    const created = await prisma.product.create({ data: body });
    return NextResponse.json({ data: created }, { status: 201 });
  },
  ["ADMIN", "MANAGER"]
);
