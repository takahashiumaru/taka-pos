import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { HttpError } from "@/server/http";
import { parseJsonBody } from "@/server/validate";
import { signToken } from "@/server/auth";
import { publicHandler } from "@/server/handler";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = publicHandler(async (req) => {
  const { email, password } = await parseJsonBody(schema, req);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) throw new HttpError(401, "Email atau password salah");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new HttpError(401, "Email atau password salah");

  const token = signToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});
