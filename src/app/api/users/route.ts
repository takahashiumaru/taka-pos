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

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["ADMIN", "MANAGER", "CASHIER"]).default("CASHIER"),
  active: z.boolean().default(true),
});

export const GET = authed(
  async () => {
    const data = await prisma.user.findMany({ select: selectSafe, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ data });
  },
  ["ADMIN", "MANAGER"]
);

export const POST = authed(
  async (req) => {
    const body = await parseJsonBody(createSchema, req);
    const passwordHash = await bcrypt.hash(body.password, 10);
    const created = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        active: body.active,
      },
      select: selectSafe,
    });
    return NextResponse.json({ data: created }, { status: 201 });
  },
  ["ADMIN"]
);
