import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseSearchParams } from "@/server/validate";
import { authed } from "@/server/handler";

const rangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const GET = authed(async (req) => {
  const q = parseSearchParams(rangeSchema, req);
  const to = q.to ? new Date(q.to) : new Date();
  const from = q.from ? new Date(q.from) : new Date(to.getTime() - q.days * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<
    Array<{ category: string | null; revenue: bigint; qty: bigint }>
  >`
    SELECT
      COALESCE(c.name, 'Tanpa Kategori') AS category,
      COALESCE(SUM(ti.subtotal), 0)      AS revenue,
      COALESCE(SUM(ti.qty), 0)           AS qty
    FROM transaction_items ti
    INNER JOIN transactions t ON t.id = ti.transaction_id
    INNER JOIN products p      ON p.id = ti.product_id
    LEFT JOIN  categories c    ON c.id = p.category_id
    WHERE t.status = 'PAID' AND t.created_at BETWEEN ${from} AND ${to}
    GROUP BY category
    ORDER BY revenue DESC
  `;

  return NextResponse.json({
    from: from.toISOString(),
    to: to.toISOString(),
    data: rows.map((r) => ({
      category: r.category,
      revenue: Number(r.revenue),
      qty: Number(r.qty),
    })),
  });
});
