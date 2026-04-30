"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Search, Package, Printer } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { Barcode } from "@/components/barcode";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageBody, PageHeader, StockBadge } from "@/components/page-header";
import { useStore } from "@/lib/store";
import { createProductApi, updateProductApi, deleteProductApi } from "@/lib/sync";
import { ApiError } from "@/lib/api";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

type FormState = Omit<Product, "id">;

const emptyForm: FormState = {
  name: "",
  sku: "",
  barcode: "",
  categoryId: "",
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 5,
  unit: "pcs",
  active: true,
};

export default function ProductsPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const [saving, setSaving] = React.useState(false);

  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "low" | "out" | "active" | "inactive">(
    "all"
  );
  const [catFilter, setCatFilter] = React.useState<string>("all");
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== "all" && p.categoryId !== catFilter) return false;
      if (filter === "low" && (p.stock <= 0 || p.stock > p.minStock))
        return false;
      if (filter === "out" && p.stock > 0) return false;
      if (filter === "active" && !p.active) return false;
      if (filter === "inactive" && p.active) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q)
      );
    });
  }, [products, query, filter, catFilter]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || "",
    });
    setOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || "",
      categoryId: p.categoryId,
      price: p.price,
      cost: p.cost,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit,
      image: p.image,
      active: p.active,
    });
    setOpen(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim() || !form.categoryId) {
      toast.error("Nama, SKU, dan kategori wajib diisi");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      if (editing) {
        await updateProductApi(editing.id, form);
        toast.success("Produk diperbarui");
      } else {
        await createProductApi(form);
        toast.success("Produk ditambah");
      }
      setOpen(false);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Gagal menyimpan produk";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Produk"
        description={`${products.length} produk · ${categories.length} kategori`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/products/labels">
                <Printer className="h-4 w-4" /> Cetak Label Barcode
              </Link>
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Tambah Produk
            </Button>
          </>
        }
      />
      <PageBody>
        <Card>
          <CardContent className="space-y-4 p-4 lg:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari nama / SKU / barcode"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filter}
                onValueChange={(v: typeof filter) => setFilter(v)}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="low">Stok menipis</SelectItem>
                  <SelectItem value="out">Stok habis</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Non-aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Harga</TableHead>
                    <TableHead className="text-right">Modal</TableHead>
                    <TableHead className="text-right">Stok</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-32 text-center text-sm text-muted-foreground"
                      >
                        Tidak ada produk.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => {
                      const cat = categories.find((c) => c.id === p.categoryId);
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-secondary">
                                {p.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{p.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-mono">{p.sku}</span>
                                  {p.barcode ? (
                                    <>
                                      {" · "}
                                      <span className="font-mono tabular-nums">
                                        {p.barcode}
                                      </span>
                                    </>
                                  ) : null}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {cat?.name || "-"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(p.price)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(p.cost)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.stock} <span className="text-xs text-muted-foreground">{p.unit}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <StockBadge stock={p.stock} minStock={p.minStock} />
                              {!p.active ? (
                                <span className="text-xs text-muted-foreground">
                                  Non-aktif
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEdit(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={async () => {
                                  if (!confirm(`Hapus produk "${p.name}"?`)) return;
                                  try {
                                    await deleteProductApi(p.id);
                                    toast.success("Produk dihapus");
                                  } catch (err) {
                                    const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Gagal menghapus";
                                    toast.error(msg);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
      </PageBody>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
            <DialogDescription>
              Isi data produk. Stok awal akan otomatis tercatat sebagai
              pergerakan stok.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ImageUpload
                value={form.image}
                onChange={(image) => setForm({ ...form, image })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nama Produk *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                placeholder="contoh: 8991001000011"
                className="font-mono"
              />
              {form.barcode && form.barcode.length >= 4 ? (
                <div className="mt-2 flex justify-center rounded-md border bg-white p-2 text-black">
                  <Barcode value={form.barcode} height={40} fontSize={11} />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Kosongkan untuk auto-generate saat simpan.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat">Kategori *</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger id="cat">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Satuan</Label>
              <Input
                id="unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Harga Jual (Rp)</Label>
              <Input
                id="price"
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value || 0) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">Harga Modal (Rp)</Label>
              <Input
                id="cost"
                type="number"
                value={form.cost}
                onChange={(e) =>
                  setForm({ ...form, cost: Number(e.target.value || 0) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">
                Stok {editing ? "(saat ini)" : "Awal"}
              </Label>
              <Input
                id="stock"
                type="number"
                value={form.stock}
                disabled={!!editing}
                onChange={(e) =>
                  setForm({ ...form, stock: Number(e.target.value || 0) })
                }
              />
              {editing ? (
                <p className="text-xs text-muted-foreground">
                  Untuk ubah stok, pakai halaman Inventory.
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minStock">Stok Minimum</Label>
              <Input
                id="minStock"
                type="number"
                value={form.minStock}
                onChange={(e) =>
                  setForm({ ...form, minStock: Number(e.target.value || 0) })
                }
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
                id="active"
              />
              <Label htmlFor="active">Produk aktif (tampil di kasir)</Label>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">
                {editing ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
