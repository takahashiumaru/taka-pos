import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseJsonBody } from "@/server/validate";
import { authed } from "@/server/handler";

const updateSchema = z.object({ name: z.string().min(1).max(100) });

export const PUT = authed(
  async (req, { params }) => {
    const body = await parseJsonBody(updateSchema, req);
    const updated = await prisma.category.update({ where: { id: params.id }, data: body });
    return NextResponse.json({ data: updated });
  },
  ["ADMIN", "MANAGER"]
);

export const DELETE = authed(
  async (_req, { params }) => {
    await prisma.category.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  },
  ["ADMIN"]
);
