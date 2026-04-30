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
    Array<{ user_id: string; name: string; revenue: bigint; count: bigint }>
  >`
    SELECT
      u.id                      AS user_id,
      u.name                    AS name,
      COALESCE(SUM(t.total), 0) AS revenue,
      COUNT(*)                  AS count
    FROM transactions t
    INNER JOIN users u ON u.id = t.user_id
    WHERE t.status = 'PAID' AND t.created_at BETWEEN ${from} AND ${to}
    GROUP BY u.id, u.name
    ORDER BY revenue DESC
  `;

  return NextResponse.json({
    from: from.toISOString(),
    to: to.toISOString(),
    data: rows.map((r) => ({
      userId: r.user_id,
      name: r.name,
      revenue: Number(r.revenue),
      count: Number(r.count),
    })),
  });
});
