import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { HttpError } from "@/server/http";
import { parseJsonBody } from "@/server/validate";
import { authed } from "@/server/handler";

const voidSchema = z.object({ reason: z.string().min(1).max(500) });

export const POST = authed(
  async (req, { params }, user) => {
    const { reason } = await parseJsonBody(voidSchema, req);
    const existing = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: { items: true },
    });
    if (!existing) throw new HttpError(404, "Transaction not found");
    if (existing.status === "VOID") throw new HttpError(400, "Transaction already voided");

    const voided = await prisma.$transaction(async (tx) => {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: "IN",
            qty: item.qty,
            reason: `Void refund: ${reason}`,
            refInvoice: existing.id,
            userId: user.id,
          },
        });
      }
      return tx.transaction.update({
        where: { id: params.id },
        data: {
          status: "VOID",
          voidedAt: new Date(),
          voidedById: user.id,
          voidedReason: reason,
        },
        include: {
          items: true,
          user: { select: { id: true, name: true } },
          voidedBy: { select: { id: true, name: true } },
        },
      });
    });

    return NextResponse.json({ data: voided });
  },
  ["ADMIN", "MANAGER"]
);
