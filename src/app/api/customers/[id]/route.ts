import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseJsonBody } from "@/server/validate";
import { authed } from "@/server/handler";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  memberLevel: z.enum(["REGULAR", "SILVER", "GOLD"]).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const PUT = authed(async (req, { params }) => {
  const body = await parseJsonBody(updateSchema, req);
  const updated = await prisma.customer.update({
    where: { id: params.id },
    data: { ...body, email: body.email === "" ? null : body.email },
  });
  return NextResponse.json({ data: updated });
});

export const DELETE = authed(
  async (_req, { params }) => {
    await prisma.customer.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  },
  ["ADMIN", "MANAGER"]
);
