"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageBody, PageHeader } from "@/components/page-header";
import { useStore } from "@/lib/store";
import { createCustomerApi, updateCustomerApi, deleteCustomerApi } from "@/lib/sync";
import { ApiError } from "@/lib/api";
import { Customer } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function CustomersPage() {
  const customers = useStore((s) => s.customers);
  const [saving, setSaving] = React.useState(false);

  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Customer | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    email: "",
  });

  const filtered = customers.filter((c) =>
    [c.name, c.phone, c.email].join(" ").toLowerCase().includes(query.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ name: "", phone: "", email: "" });
    setOpen(true);
  }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "" });
    setOpen(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCustomerApi(editing.id, {
          name: form.name,
          phone: form.phone || undefined,
          email: form.email || undefined,
        });
        toast.success("Pelanggan diperbarui");
      } else {
        await createCustomerApi({
          name: form.name,
          phone: form.phone || undefined,
          email: form.email || undefined,
        });
        toast.success("Pelanggan ditambah");
      }
      setOpen(false);
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
        title="Pelanggan"
        description={`${customers.length} pelanggan terdaftar`}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah Pelanggan
          </Button>
        }
      />
      <PageBody>
        <Card>
          <CardContent className="space-y-4 p-4 lg:p-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama / telepon / email"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Total Belanja</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-32 text-center text-sm text-muted-foreground"
                      >
                        Tidak ada pelanggan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.phone || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.email || "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(c.totalSpend)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.level === "gold"
                                ? "warning"
                                : c.level === "silver"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {c.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(c)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm(`Hapus "${c.name}"?`)) {
                                  deleteCustomerApi(c.id).catch((err) => toast.error(err instanceof Error ? err.message : "Gagal"));
                                  toast.success("Pelanggan dihapus");
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Pelanggan" : "Tambah Pelanggan"}
            </DialogTitle>
            <DialogDescription>Isi data pelanggan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cname">Nama *</Label>
              <Input
                id="cname"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone">Telepon</Label>
              <Input
                id="cphone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cemail">Email</Label>
              <Input
                id="cemail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              <Button type="submit">{editing ? "Simpan" : "Tambah"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
