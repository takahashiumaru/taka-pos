"use client";

import * as React from "react";
import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { PageBody, PageHeader } from "@/components/page-header";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PaymentMethod, TransactionStatus } from "@/lib/types";

export default function TransactionsPage() {
  const transactions = useStore((s) => s.transactions);
  const users = useStore((s) => s.users);

  const [query, setQuery] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethod | "all">("all");
  const [status, setStatus] = React.useState<TransactionStatus | "all">("all");
  const [period, setPeriod] = React.useState<"today" | "7" | "30" | "all">(
    "all"
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    return transactions.filter((t) => {
      if (q && !t.id.toLowerCase().includes(q)) return false;
      if (method !== "all" && t.method !== method) return false;
      if (status !== "all" && t.status !== status) return false;
      if (period !== "all") {
        const days = period === "today" ? 1 : period === "7" ? 7 : 30;
        if (now - new Date(t.createdAt).getTime() > days * 86400000)
          return false;
      }
      return true;
    });
  }, [transactions, query, method, status, period]);

  const totalRevenue = filtered
    .filter((t) => t.status === "paid")
    .reduce((s, t) => s + t.total, 0);

  return (
    <>
      <PageHeader
        title="Transaksi"
        description={`${transactions.length} transaksi tercatat`}
      />
      <PageBody>
        <Card>
          <CardContent className="space-y-4 p-4 lg:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nomor invoice"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select
                value={period}
                onValueChange={(v: typeof period) => setPeriod(v)}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua waktu</SelectItem>
                  <SelectItem value="today">Hari ini</SelectItem>
                  <SelectItem value="7">7 hari</SelectItem>
                  <SelectItem value="30">30 hari</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={method}
                onValueChange={(v: typeof method) => setMethod(v)}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua metode</SelectItem>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="card">Kartu</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(v: typeof status) => setStatus(v)}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="hold">Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-secondary/40 px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {filtered.length} transaksi
              </span>
              <span className="font-semibold tabular-nums">
                Total: {formatCurrency(totalRevenue)}
              </span>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kasir</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead className="text-right">Item</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-32 text-center text-sm text-muted-foreground"
                      >
                        Tidak ada transaksi.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.slice(0, 200).map((t) => (
                      <TableRow key={t.id} className="cursor-pointer">
                        <TableCell className="font-mono text-sm">
                          <Link
                            href={`/transactions/detail?id=${t.id}`}
                            className="hover:text-primary"
                          >
                            {t.id}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(t.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {t.cashierName ||
                            users.find((u) => u.id === t.cashierId)?.name ||
                            "-"}
                        </TableCell>
                        <TableCell className="text-sm uppercase">
                          {t.method}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.items.reduce((s, i) => s + i.qty, 0)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(t.total)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              t.status === "paid"
                                ? "success"
                                : t.status === "void"
                                ? "danger"
                                : t.status === "refund"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/transactions/detail?id=${t.id}`}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
