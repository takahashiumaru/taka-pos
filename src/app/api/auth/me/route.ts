import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { HttpError } from "@/server/http";
import { authed } from "@/server/handler";

export const GET = authed(async (_req, _ctx, authUser) => {
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  if (!user) throw new HttpError(404, "User not found");
  return NextResponse.json({ user });
});
