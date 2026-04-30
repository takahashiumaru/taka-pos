"use client";

import * as React from "react";
import {
  Banknote,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBody, PageHeader, StockBadge } from "@/components/page-header";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const transactions = useStore((s) => s.transactions);
  const products = useStore((s) => s.products);
  const customers = useStore((s) => s.customers);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayTx = transactions.filter(
    (t) => t.status === "paid" && new Date(t.createdAt) >= today
  );
  const todayRevenue = todayTx.reduce((s, t) => s + t.total, 0);
  const todayItems = todayTx.reduce(
    (s, t) => s + t.items.reduce((q, i) => q + i.qty, 0),
    0
  );

  const lowStock = products.filter(
    (p) => p.active && p.stock > 0 && p.stock <= p.minStock
  );
  const outOfStock = products.filter((p) => p.active && p.stock <= 0);

  // 7-day chart
  const days: { day: string; revenue: number; tx: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const dayTx = transactions.filter(
      (t) =>
        t.status === "paid" &&
        new Date(t.createdAt) >= start &&
        new Date(t.createdAt) < end
    );
    days.push({
      day: start.toLocaleDateString("id-ID", { weekday: "short" }),
      revenue: dayTx.reduce((s, t) => s + t.total, 0),
      tx: dayTx.length,
    });
  }

  // Top products (by qty in last 30 days)
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const productSales = new Map<string, number>();
  transactions
    .filter((t) => t.status === "paid" && new Date(t.createdAt) >= monthAgo)
    .forEach((t) =>
      t.items.forEach((it) =>
        productSales.set(
          it.productId,
          (productSales.get(it.productId) || 0) + it.qty
        )
      )
    );
  const topProducts = Array.from(productSales.entries())
    .map(([id, qty]) => ({
      product: products.find((p) => p.id === id),
      qty,
    }))
    .filter((x) => x.product)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const recentTx = transactions
    .filter((t) => t.status === "paid")
    .slice(0, 6);

  const kpis = [
    {
      label: "Omzet Hari Ini",
      value: formatCurrency(todayRevenue),
      icon: Banknote,
      tone: "text-primary",
    },
    {
      label: "Transaksi Hari Ini",
      value: formatNumber(todayTx.length),
      icon: Receipt,
      tone: "text-foreground",
    },
    {
      label: "Item Terjual",
      value: formatNumber(todayItems),
      icon: ShoppingBag,
      tone: "text-foreground",
    },
    {
      label: "Stok Kritis",
      value: formatNumber(lowStock.length + outOfStock.length),
      icon: TriangleAlert,
      tone: "text-warning",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Ringkasan operasional toko hari ini.`}
        actions={
          <Button asChild>
            <Link href="/pos">
              <ShoppingBag className="h-4 w-4" /> Buka Kasir
            </Link>
          </Button>
        }
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{k.label}</p>
                    <Icon className={`h-5 w-5 ${k.tone}`} />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {k.value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Penjualan 7 Hari Terakhir
              </CardTitle>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" /> total{" "}
                {formatCurrency(days.reduce((s, d) => s + d.revenue, 0))}
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-72 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={days}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Produk Terlaris (30 hari)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada penjualan.
                </p>
              ) : (
                topProducts.map((tp, i) => (
                  <div
                    key={tp.product!.id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-sm font-semibold">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {tp.product!.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {tp.product!.sku} · {formatCurrency(tp.product!.price)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {tp.qty} terjual
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaksi Terkini</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {recentTx.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Belum ada transaksi.
                </p>
              ) : (
                recentTx.map((t) => (
                  <Link
                    key={t.id}
                    href={`/transactions/detail?id=${t.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">{t.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(t.createdAt)} · {t.cashierName} ·{" "}
                        {t.items.length} item
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(t.total)}
                      </p>
                      <p className="text-xs uppercase text-muted-foreground">
                        {t.method}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Stok Kritis</CardTitle>
              <span className="text-xs text-muted-foreground">
                {customers.length} pelanggan terdaftar ·{" "}
                {products.filter((p) => p.active).length} produk aktif
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {lowStock.length + outOfStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Semua stok aman.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {[...outOfStock, ...lowStock].slice(0, 9).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Stok: <Package className="inline h-3 w-3" />{" "}
                        <span className="tabular-nums">
                          {p.stock} {p.unit}
                        </span>{" "}
                        · min {p.minStock}
                      </p>
                    </div>
                    <StockBadge stock={p.stock} minStock={p.minStock} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
