"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBody, PageHeader } from "@/components/page-header";
import { useStore } from "@/lib/store";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

export default function ReportsPage() {
  const transactions = useStore((s) => s.transactions);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const users = useStore((s) => s.users);

  const [period, setPeriod] = React.useState<"7" | "30" | "all">("30");

  const fromDate = React.useMemo(() => {
    if (period === "all") return new Date(0);
    const d = new Date();
    d.setDate(d.getDate() - parseInt(period, 10));
    return d;
  }, [period]);

  const filtered = transactions.filter(
    (t) => t.status === "paid" && new Date(t.createdAt) >= fromDate
  );

  const totalRevenue = filtered.reduce((s, t) => s + t.total, 0);
  const totalTx = filtered.length;
  const avgTx = totalTx ? totalRevenue / totalTx : 0;

  // Daily series (up to 30 days)
  const series: { day: string; revenue: number }[] = [];
  const days = period === "7" ? 7 : period === "30" ? 30 : 14;
  for (let i = days - 1; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const dayTx = filtered.filter(
      (t) =>
        new Date(t.createdAt) >= start && new Date(t.createdAt) < end
    );
    series.push({
      day: start.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      }),
      revenue: dayTx.reduce((s, t) => s + t.total, 0),
    });
  }

  // Per category
  const catMap = new Map<string, { revenue: number; qty: number }>();
  filtered.forEach((t) =>
    t.items.forEach((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) return;
      const cur = catMap.get(p.categoryId) || { revenue: 0, qty: 0 };
      cur.revenue += it.price * it.qty;
      cur.qty += it.qty;
      catMap.set(p.categoryId, cur);
    })
  );
  const catRows = Array.from(catMap.entries())
    .map(([id, v]) => ({
      category: categories.find((c) => c.id === id)?.name || "-",
      revenue: v.revenue,
      qty: v.qty,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Per cashier
  const userMap = new Map<string, { revenue: number; tx: number }>();
  filtered.forEach((t) => {
    const cur = userMap.get(t.cashierId) || { revenue: 0, tx: 0 };
    cur.revenue += t.total;
    cur.tx += 1;
    userMap.set(t.cashierId, cur);
  });
  const userRows = Array.from(userMap.entries())
    .map(([id, v]) => ({
      cashier: users.find((u) => u.id === id)?.name || id,
      revenue: v.revenue,
      tx: v.tx,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  function exportCSV() {
    const header = [
      "invoice",
      "tanggal",
      "kasir",
      "metode",
      "subtotal",
      "diskon",
      "pajak",
      "total",
    ].join(",");
    const rows = filtered.map((t) =>
      [
        t.id,
        t.createdAt,
        t.cashierName || t.cashierId,
        t.method,
        t.subtotal,
        t.discount,
        t.tax,
        t.total,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil diunduh");
  }

  return (
    <>
      <PageHeader
        title="Laporan"
        description="Insight penjualan, kategori, dan kasir"
        actions={
          <div className="flex gap-2">
            <Select
              value={period}
              onValueChange={(v: typeof period) => setPeriod(v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 hari</SelectItem>
                <SelectItem value="30">30 hari</SelectItem>
                <SelectItem value="all">Semua</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        }
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Omzet</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatCurrency(totalRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Transaksi</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatNumber(totalTx)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                Rata-rata / Transaksi
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatCurrency(avgTx)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Penjualan Harian</CardTitle>
          </CardHeader>
          <CardContent className="h-72 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}jt`
                      : v >= 1000
                      ? `${Math.round(v / 1000)}rb`
                      : `${v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                  formatter={(v) => formatCurrency(Number(v))}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Tabs defaultValue="cat">
          <TabsList>
            <TabsTrigger value="cat">Per Kategori</TabsTrigger>
            <TabsTrigger value="user">Per Kasir</TabsTrigger>
          </TabsList>
          <TabsContent value="cat">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Item</TableHead>
                        <TableHead className="text-right">Omzet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="h-24 text-center text-sm text-muted-foreground"
                          >
                            Tidak ada data.
                          </TableCell>
                        </TableRow>
                      ) : (
                        catRows.map((r) => (
                          <TableRow key={r.category}>
                            <TableCell className="font-medium">
                              {r.category}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.qty}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">
                              {formatCurrency(r.revenue)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="user">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kasir</TableHead>
                        <TableHead className="text-right">Transaksi</TableHead>
                        <TableHead className="text-right">Omzet</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userRows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="h-24 text-center text-sm text-muted-foreground"
                          >
                            Tidak ada data.
                          </TableCell>
                        </TableRow>
                      ) : (
                        userRows.map((r) => (
                          <TableRow key={r.cashier}>
                            <TableCell className="font-medium">
                              {r.cashier}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {r.tx}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold">
                              {formatCurrency(r.revenue)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
