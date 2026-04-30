import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseJsonBody } from "@/server/validate";
import { authed } from "@/server/handler";

const updateSchema = z.object({
  storeName: z.string().min(1).max(100).optional(),
  storeAddress: z.string().max(500).nullable().optional(),
  storePhone: z.string().max(30).nullable().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  currency: z.string().max(10).optional(),
  receiptFooter: z.string().max(500).nullable().optional(),
  paymentMethods: z.string().max(200).optional(),
  lowStockAlertEnabled: z.boolean().optional(),
});

async function getOrCreateSettings() {
  let s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) s = await prisma.settings.create({ data: { id: 1 } });
  return s;
}

export const GET = authed(async () => {
  const settings = await getOrCreateSettings();
  return NextResponse.json({ data: settings });
});

export const PUT = authed(
  async (req) => {
    const body = await parseJsonBody(updateSchema, req);
    await getOrCreateSettings();
    const updated = await prisma.settings.update({ where: { id: 1 }, data: body });
    return NextResponse.json({ data: updated });
  },
  ["ADMIN", "MANAGER"]
);
