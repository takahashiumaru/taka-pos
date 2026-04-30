"use client";

import * as React from "react";
import { ArrowDownCircle, ArrowUpCircle, Edit3, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { PageBody, PageHeader, StockBadge } from "@/components/page-header";
import { useStore } from "@/lib/store";
import { addStockMovementApi } from "@/lib/sync";
import { ApiError } from "@/lib/api";
import { StockMovementType } from "@/lib/types";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { toast } from "sonner";

export default function InventoryPage() {
  const products = useStore((s) => s.products);
  const movements = useStore((s) => s.movements);
  const [saving, setSaving] = React.useState(false);

  const [open, setOpen] = React.useState(false);
  const [productId, setProductId] = React.useState<string>("");
  const [type, setType] = React.useState<StockMovementType>("in");
  const [qty, setQty] = React.useState<number>(0);
  const [reason, setReason] = React.useState<string>("");

  const lowStock = products.filter(
    (p) => p.active && p.stock > 0 && p.stock <= p.minStock
  );
  const outOfStock = products.filter((p) => p.active && p.stock <= 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || qty === 0) {
      toast.error("Pilih produk & jumlah tidak boleh 0");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await addStockMovementApi({
        productId,
        type,
        qty: Math.abs(qty),
        reason: reason || undefined,
      });
      toast.success("Pergerakan stok dicatat");
      setOpen(false);
      setProductId("");
      setQty(0);
      setReason("");
      setType("in");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Inventory"
        description={`${movements.length} pergerakan tercatat`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Catat Pergerakan
          </Button>
        }
      />
      <PageBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Produk</p>
                <Edit3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {formatNumber(products.length)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Stok Menipis</p>
                <TriangleAlert className="h-5 w-5 text-warning" />
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-warning">
                {formatNumber(lowStock.length)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Stok Habis</p>
                <TriangleAlert className="h-5 w-5 text-destructive" />
              </div>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-destructive">
                {formatNumber(outOfStock.length)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="movements">
          <TabsList>
            <TabsTrigger value="movements">Pergerakan Stok</TabsTrigger>
            <TabsTrigger value="alerts">Alert Stok</TabsTrigger>
          </TabsList>

          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Riwayat Pergerakan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead>Ref</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="h-32 text-center text-sm text-muted-foreground"
                          >
                            Belum ada pergerakan stok.
                          </TableCell>
                        </TableRow>
                      ) : (
                        movements.slice(0, 200).map((m) => {
                          const p = products.find((x) => x.id === m.productId);
                          const Icon = m.qty >= 0 ? ArrowUpCircle : ArrowDownCircle;
                          const tone =
                            m.qty >= 0 ? "text-success" : "text-destructive";
                          return (
                            <TableRow key={m.id}>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDateTime(m.createdAt)}
                              </TableCell>
                              <TableCell>
                                <p className="text-sm font-medium">
                                  {p?.name || m.productId}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p?.sku}
                                </p>
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center gap-1 capitalize ${tone}`}
                                >
                                  <Icon className="h-4 w-4" /> {m.type}
                                </span>
                              </TableCell>
                              <TableCell
                                className={`text-right tabular-nums font-semibold ${tone}`}
                              >
                                {m.qty > 0 ? "+" : ""}
                                {m.qty}
                              </TableCell>
                              <TableCell className="text-sm">
                                {m.reason || "-"}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {m.refId || "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Produk Butuh Perhatian
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Stok</TableHead>
                        <TableHead className="text-right">Min Stok</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...outOfStock, ...lowStock].length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="h-24 text-center text-sm text-muted-foreground"
                          >
                            Semua stok aman.
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...outOfStock, ...lowStock].map((p) => (
                          <TableRow key={p.id}>
                            <TableCell>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.sku}
                              </p>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {p.stock} {p.unit}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {p.minStock}
                            </TableCell>
                            <TableCell>
                              <StockBadge
                                stock={p.stock}
                                minStock={p.minStock}
                              />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pergerakan Stok</DialogTitle>
            <DialogDescription>
              Tambah, kurangi, atau sesuaikan stok dengan alasan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Produk</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih produk" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} (stok {p.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipe</Label>
                <Select
                  value={type}
                  onValueChange={(v: StockMovementType) => setType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Masuk (in)</SelectItem>
                    <SelectItem value="out">Keluar (out)</SelectItem>
                    <SelectItem value="adjust">Adjustment (±)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>
                  Jumlah {type === "adjust" ? "(boleh negatif)" : ""}
                </Label>
                <Input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value || 0))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Alasan</Label>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="cth: Penerimaan PO #123, Rusak, Hilang"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
