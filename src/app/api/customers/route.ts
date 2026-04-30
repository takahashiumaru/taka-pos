import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseJsonBody, parseSearchParams } from "@/server/validate";
import { authed } from "@/server/handler";

const listSchema = z.object({
  q: z.string().optional(),
  memberLevel: z.enum(["REGULAR", "SILVER", "GOLD"]).optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  memberLevel: z.enum(["REGULAR", "SILVER", "GOLD"]).default("REGULAR"),
  notes: z.string().max(2000).nullable().optional(),
});

export const GET = authed(async (req) => {
  const q = parseSearchParams(listSchema, req);
  const where = {
    ...(q.q
      ? {
          OR: [
            { name: { contains: q.q } },
            { phone: { contains: q.q } },
            { email: { contains: q.q } },
          ],
        }
      : {}),
    ...(q.memberLevel ? { memberLevel: q.memberLevel } : {}),
  };
  const data = await prisma.customer.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json({ data });
});

export const POST = authed(async (req) => {
  const body = await parseJsonBody(createSchema, req);
  const created = await prisma.customer.create({
    data: {
      ...body,
      email: body.email || null,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
});
