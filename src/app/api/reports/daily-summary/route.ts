import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/prisma";
import { parseSearchParams } from "@/server/validate";
import { authed } from "@/server/handler";

const rangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).default(7),
});

export const GET = authed(async (req) => {
  const q = parseSearchParams(rangeSchema, req);
  const to = q.to ? new Date(q.to) : new Date();
  const from = q.from ? new Date(q.from) : new Date(to.getTime() - q.days * 24 * 60 * 60 * 1000);

  const rows = await prisma.$queryRaw<
    Array<{ day: string; revenue: bigint; count: bigint; items: bigint }>
  >`
    SELECT
      DATE_FORMAT(t.created_at, '%Y-%m-%d') AS day,
      COALESCE(SUM(t.total), 0)              AS revenue,
      COUNT(*)                               AS count,
      COALESCE(SUM(ti_qty.qty), 0)           AS items
    FROM transactions t
    LEFT JOIN (
      SELECT transaction_id, SUM(qty) AS qty
      FROM transaction_items
      GROUP BY transaction_id
    ) ti_qty ON ti_qty.transaction_id = t.id
    WHERE t.status = 'PAID' AND t.created_at BETWEEN ${from} AND ${to}
    GROUP BY day
    ORDER BY day ASC
  `;

  return NextResponse.json({
    from: from.toISOString(),
    to: to.toISOString(),
    data: rows.map((r) => ({
      day: r.day,
      revenue: Number(r.revenue),
      count: Number(r.count),
      items: Number(r.items),
    })),
  });
});
