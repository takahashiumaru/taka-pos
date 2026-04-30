import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseJsonBody } from "@/server/validate";
import { authed } from "@/server/handler";

const createSchema = z.object({ name: z.string().min(1).max(100) });

export const GET = authed(async () => {
  const data = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json({ data });
});

export const POST = authed(
  async (req) => {
    const body = await parseJsonBody(createSchema, req);
    const created = await prisma.category.create({ data: body });
    return NextResponse.json({ data: created }, { status: 201 });
  },
  ["ADMIN", "MANAGER"]
);
