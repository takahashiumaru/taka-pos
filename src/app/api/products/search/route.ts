import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { HttpError } from "@/server/http";
import { authed } from "@/server/handler";

export const GET = authed(async (req) => {
  const barcode = (req.nextUrl.searchParams.get("barcode") ?? "").trim();
  if (!barcode) throw new HttpError(400, "Missing ?barcode=");
  const product = await prisma.product.findUnique({
    where: { barcode },
    include: { category: true },
  });
  if (!product) throw new HttpError(404, "Product not found");
  return NextResponse.json({ data: product });
});
