"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { voidTransactionApi } from "@/lib/sync";
import { ApiError } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Receipt } from "@/components/receipt";
import { toast } from "sonner";

export default function TransactionDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Memuat…
        </div>
      }
    >
      <TransactionDetailInner />
    </React.Suspense>
  );
}

function TransactionDetailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id") || "";
  const tx = useStore((s) => s.transactions.find((t) => t.id === id));
  const products = useStore((s) => s.products);
  const customers = useStore((s) => s.customers);
  const [voiding, setVoiding] = React.useState(false);

  if (!tx) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-lg font-semibold">Transaksi tidak ditemukan</p>
        <Button asChild variant="outline">
          <Link href="/transactions">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </Button>
      </div>
    );
  }

  const customer = tx.customerId
    ? customers.find((c) => c.id === tx.customerId)
    : null;

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {tx.id}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(tx.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              tx.status === "paid"
                ? "success"
                : tx.status === "void"
                ? "danger"
                : tx.status === "refund"
                ? "warning"
                : "secondary"
            }
          >
            {tx.status}
          </Badge>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="no-print"
          >
            <Printer className="h-4 w-4" /> Print
          </Button>
          {tx.status === "paid" ? (
            <Button
              variant="destructive"
              disabled={voiding}
              onClick={async () => {
                const reason = window.prompt("Alasan void transaksi? (stok akan dikembalikan)", "Customer refund");
                if (!reason || !reason.trim()) return;
                setVoiding(true);
                try {
                  await voidTransactionApi(tx.id, reason.trim());
                  toast.success("Transaksi divoid");
                } catch (err) {
                  const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Gagal void";
                  toast.error(msg);
                } finally {
                  setVoiding(false);
                }
              }}
              className="no-print"
            >
              <Ban className="h-4 w-4" /> Void
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Harga</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tx.items.map((it) => {
                      const p = products.find((x) => x.id === it.productId);
                      return (
                        <TableRow key={it.productId}>
                          <TableCell>
                            <p className="font-medium">{p?.name || "-"}</p>
                            <p className="text-xs text-muted-foreground">
                              {p?.sku}
                            </p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(it.price)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {it.qty}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrency(it.qty * it.price)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  {formatCurrency(tx.subtotal)}
                </span>
              </div>
              {tx.discount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diskon</span>
                  <span className="tabular-nums">
                    -{formatCurrency(tx.discount)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pajak</span>
                <span className="tabular-nums">{formatCurrency(tx.tax)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatCurrency(tx.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Bayar ({tx.method.toUpperCase()})
                </span>
                <span className="tabular-nums">
                  {formatCurrency(tx.paid)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kembalian</span>
                <span className="tabular-nums">
                  {formatCurrency(tx.change)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Kasir</p>
                <p className="font-medium">{tx.cashierName || tx.cashierId}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pelanggan</p>
                <p className="font-medium">
                  {customer ? customer.name : "Walk-in"}
                </p>
              </div>
              {tx.note ? (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Catatan</p>
                  <p className="font-medium">{tx.note}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="px-1 text-sm font-medium text-muted-foreground">
            Struk
          </h3>
          <div className="rounded-md border bg-white text-black shadow-sm">
            <Receipt transaction={tx} />
          </div>
        </div>
      </div>
    </div>
  );
}
