import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { HttpError } from "@/server/http";
import { authed } from "@/server/handler";

export const GET = authed(async (_req, { params }) => {
  const tx = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true } },
      customer: true,
      voidedBy: { select: { id: true, name: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, barcode: true } },
        },
      },
    },
  });
  if (!tx) throw new HttpError(404, "Transaction not found");
  return NextResponse.json({ data: tx });
});
