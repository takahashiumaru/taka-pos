"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBody, PageHeader } from "@/components/page-header";
import { useStore } from "@/lib/store";
import { updateSettingsApi, createUserApi, updateUserApi, deleteUserApi } from "@/lib/sync";
import { ApiError } from "@/lib/api";
import { PaymentMethod, UserRole } from "@/lib/types";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

const allMethods: PaymentMethod[] = ["cash", "card", "qris", "transfer"];

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const users = useStore((s) => s.users);
  const [savingStore, setSavingStore] = React.useState(false);
  const [savingUser, setSavingUser] = React.useState(false);

  const [storeName, setStoreName] = React.useState(settings.storeName);
  const [address, setAddress] = React.useState(settings.address);
  const [phone, setPhone] = React.useState(settings.phone);
  const [taxRate, setTaxRate] = React.useState<number>(settings.taxRate);
  const [taxInclusive, setTaxInclusive] = React.useState<boolean>(
    settings.taxInclusive
  );
  const [receiptFooter, setReceiptFooter] = React.useState(
    settings.receiptFooter
  );
  const [allowBackorder, setAllowBackorder] = React.useState(
    settings.allowBackorder
  );

  async function saveStore(e: React.FormEvent) {
    e.preventDefault();
    if (savingStore) return;
    setSavingStore(true);
    try {
      await updateSettingsApi({
        storeName,
        address,
        phone,
        taxRate,
        taxInclusive,
        receiptFooter,
        allowBackorder,
      });
      toast.success("Pengaturan disimpan");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setSavingStore(false);
    }
  }

  async function toggleMethod(m: PaymentMethod, on: boolean) {
    const current = settings.enableMethods;
    const next = on ? Array.from(new Set([...current, m])) : current.filter((x) => x !== m);
    if (next.length === 0) {
      toast.error("Minimal satu metode aktif");
      return;
    }
    try {
      await updateSettingsApi({ enableMethods: next });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Gagal menyimpan";
      toast.error(msg);
    }
  }

  // User form state
  const [uOpen, setUOpen] = React.useState(false);
  const [uForm, setUForm] = React.useState<{
    id?: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    active: boolean;
  }>({
    name: "",
    email: "",
    password: "",
    role: "cashier",
    active: true,
  });

  async function submitUser(e: React.FormEvent) {
    e.preventDefault();
    if (!uForm.name.trim() || !uForm.email.trim()) {
      toast.error("Nama & email wajib");
      return;
    }
    if (!uForm.id && !uForm.password.trim()) {
      toast.error("Password wajib untuk user baru");
      return;
    }
    if (savingUser) return;
    setSavingUser(true);
    try {
      if (uForm.id) {
        await updateUserApi(uForm.id, {
          name: uForm.name,
          email: uForm.email,
          role: uForm.role,
          active: uForm.active,
          ...(uForm.password ? { password: uForm.password } : {}),
        });
        toast.success("User diperbarui");
      } else {
        await createUserApi({
          name: uForm.name,
          email: uForm.email,
          password: uForm.password,
          role: uForm.role,
          active: uForm.active,
        });
        toast.success("User ditambah");
      }
      setUForm({ name: "", email: "", password: "", role: "cashier", active: true });
      setUOpen(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setSavingUser(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Profil toko, pajak, pembayaran, dan user"
      />
      <PageBody>
        <Tabs defaultValue="store">
          <TabsList>
            <TabsTrigger value="store">Toko</TabsTrigger>
            <TabsTrigger value="payment">Pembayaran</TabsTrigger>
            <TabsTrigger value="appearance">Tampilan</TabsTrigger>
            <TabsTrigger value="users">User & Role</TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profil Toko</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={saveStore} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Nama Toko</Label>
                      <Input
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telepon</Label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Alamat</Label>
                      <Textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pajak / PPN (%)</Label>
                      <Input
                        type="number"
                        value={taxRate}
                        onChange={(e) =>
                          setTaxRate(Number(e.target.value || 0))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-3 self-end pb-1">
                      <Switch
                        checked={taxInclusive}
                        onCheckedChange={setTaxInclusive}
                      />
                      <Label>Pajak inclusive (sudah termasuk harga)</Label>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Footer Struk</Label>
                      <Input
                        value={receiptFooter}
                        onChange={(e) => setReceiptFooter(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-3 sm:col-span-2">
                      <Switch
                        checked={allowBackorder}
                        onCheckedChange={setAllowBackorder}
                      />
                      <Label>Izinkan checkout walau stok 0 (backorder)</Label>
                    </div>
                  </div>
                  <Button type="submit">Simpan</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metode Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {allMethods.map((m) => (
                  <div
                    key={m}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium capitalize">{m}</p>
                      <p className="text-xs text-muted-foreground">
                        Aktifkan untuk muncul di modal pembayaran
                      </p>
                    </div>
                    <Switch
                      checked={settings.enableMethods.includes(m)}
                      onCheckedChange={(v) => toggleMethod(m, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <p className="text-sm text-muted-foreground">
                    Pilih Light / Dark / System
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">User & Role</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setUForm({
                        name: "",
                        email: "",
                        password: "",
                        role: "cashier",
                        active: true,
                      });
                      setUOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" /> Tambah User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            <button
                              onClick={() => {
                                setUForm({
                                  id: u.id,
                                  name: u.name,
                                  email: u.email,
                                  password: "",
                                  role: u.role,
                                  active: u.active,
                                });
                                setUOpen(true);
                              }}
                              className="hover:text-primary"
                            >
                              {u.name}
                            </button>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={u.active ? "success" : "secondary"}
                            >
                              {u.active ? "Aktif" : "Non-aktif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={async () => {
                                if (!confirm(`Hapus "${u.name}"?`)) return;
                                try {
                                  await deleteUserApi(u.id);
                                  toast.success("User dihapus");
                                } catch (err) {
                                  const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Gagal";
                                  toast.error(msg);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {uOpen ? (
                  <form
                    onSubmit={submitUser}
                    className="mt-4 grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-2"
                  >
                    <div className="space-y-1.5">
                      <Label>Nama</Label>
                      <Input
                        value={uForm.name}
                        onChange={(e) =>
                          setUForm({ ...uForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={uForm.email}
                        onChange={(e) =>
                          setUForm({ ...uForm, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>
                        Password {uForm.id ? "(kosongkan jika tidak diubah)" : ""}
                      </Label>
                      <Input
                        type="password"
                        value={uForm.password}
                        onChange={(e) =>
                          setUForm({ ...uForm, password: e.target.value })
                        }
                        placeholder={uForm.id ? "•••••••• (tidak diubah)" : "Min 6 karakter"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select
                        value={uForm.role}
                        onValueChange={(v: UserRole) =>
                          setUForm({ ...uForm, role: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="cashier">Cashier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-3 self-end pb-1">
                      <Switch
                        checked={uForm.active}
                        onCheckedChange={(v) =>
                          setUForm({ ...uForm, active: v })
                        }
                      />
                      <Label>Aktif</Label>
                    </div>
                    <div className="flex justify-end gap-2 sm:col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setUOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button type="submit">
                        {uForm.id ? "Simpan" : "Tambah"}
                      </Button>
                    </div>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
