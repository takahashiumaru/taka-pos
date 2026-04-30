import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseJsonBody } from "@/server/validate";
import { authed } from "@/server/handler";

const selectSafe = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]).optional(),
  active: z.boolean().optional(),
});

export const PUT = authed(
  async (req, { params }) => {
    const body = await parseJsonBody(updateSchema, req);
    const { password, ...rest } = body;
    const data: Record<string, unknown> = { ...rest };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: selectSafe,
    });
    return NextResponse.json({ data: updated });
  },
  ["ADMIN"]
);

export const DELETE = authed(
  async (_req, { params }) => {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  },
  ["ADMIN"]
);
