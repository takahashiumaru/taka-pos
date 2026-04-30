import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseSearchParams } from "@/server/validate";
import { authed } from "@/server/handler";

const schema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const GET = authed(async (req) => {
  const q = parseSearchParams(schema, req);
  const to = q.to ? new Date(q.to) : new Date();
  const from = q.from ? new Date(q.from) : new Date(to.getTime() - q.days * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<
    Array<{ product_id: string; name: string; qty: bigint; revenue: bigint }>
  >`
    SELECT
      ti.product_id                AS product_id,
      ti.name                      AS name,
      COALESCE(SUM(ti.qty), 0)     AS qty,
      COALESCE(SUM(ti.subtotal),0) AS revenue
    FROM transaction_items ti
    INNER JOIN transactions t ON t.id = ti.transaction_id
    WHERE t.status = 'PAID' AND t.created_at BETWEEN ${from} AND ${to}
    GROUP BY ti.product_id, ti.name
    ORDER BY qty DESC
    LIMIT ${q.limit}
  `;

  return NextResponse.json({
    from: from.toISOString(),
    to: to.toISOString(),
    data: rows.map((r) => ({
      productId: r.product_id,
      name: r.name,
      qty: Number(r.qty),
      revenue: Number(r.revenue),
    })),
  });
});
