"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  PauseCircle,
  PlayCircle,
  X,
  Calculator,
  Receipt as ReceiptIcon,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRightLeft,
  Printer,
  ScanBarcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCartTotals, useStore } from "@/lib/store";
import { checkoutViaApi } from "@/lib/sync";
import { ApiError } from "@/lib/api";
import { Product, PaymentMethod } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Receipt } from "@/components/receipt";
import { StockBadge } from "@/components/page-header";

const methodIcons: Record<
  PaymentMethod,
  React.ComponentType<{ className?: string }>
> = {
  cash: Banknote,
  card: CreditCard,
  qris: QrCode,
  transfer: ArrowRightLeft,
};

export default function POSPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const cart = useStore((s) => s.cart);
  const parked = useStore((s) => s.parked);
  const settings = useStore((s) => s.settings);
  const transactions = useStore((s) => s.transactions);
  const customers = useStore((s) => s.customers);

  const addToCart = useStore((s) => s.addToCart);
  const parkCurrentCart = useStore((s) => s.parkCurrentCart);
  const resumeParked = useStore((s) => s.resumeParked);
  const deleteParked = useStore((s) => s.deleteParked);
  const cartDiscount = useStore((s) => s.cartDiscount);
  const cartCustomerId = useStore((s) => s.cartCustomerId);

  const totals = useCartTotals();

  const [query, setQuery] = React.useState("");
  const [activeCat, setActiveCat] = React.useState<string>("all");
  const [payOpen, setPayOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [parkedOpen, setParkedOpen] = React.useState(false);
  const [lastTxId, setLastTxId] = React.useState<string | null>(null);
  const [scanMode, setScanMode] = React.useState(false);
  const [scanFlash, setScanFlash] = React.useState(false);

  const searchRef = React.useRef<HTMLInputElement>(null);
  const scanRef = React.useRef<HTMLInputElement>(null);
  const [scanValue, setScanValue] = React.useState("");

  const handleScanSubmit = React.useCallback(
    (raw: string) => {
      const code = raw.trim();
      if (!code) return;
      const exact = products.find(
        (p) =>
          p.barcode === code || p.sku.toLowerCase() === code.toLowerCase()
      );
      if (exact) {
        if (!settings.allowBackorder && exact.stock <= 0) {
          toast.error(`${exact.name}: stok habis`);
        } else {
          addToCart(exact.id, 1);
          toast.success(`${exact.name} +1`, { duration: 800 });
          setScanFlash(true);
          window.setTimeout(() => setScanFlash(false), 250);
        }
      } else {
        toast.error(`Barcode "${code}" tidak ditemukan`);
      }
      setScanValue("");
    },
    [products, addToCart, settings.allowBackorder]
  );

  React.useEffect(() => {
    if (scanMode) {
      scanRef.current?.focus();
    }
  }, [scanMode]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.active) return false;
      if (activeCat !== "all" && p.categoryId !== activeCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode || "").toLowerCase().includes(q)
      );
    });
  }, [products, query, activeCat]);

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "F3") {
        e.preventDefault();
        setScanMode((v) => !v);
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) setPayOpen(true);
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) {
          parkCurrentCart();
          toast.success("Cart diparkir");
        }
      } else if (e.key === "Escape") {
        setPayOpen(false);
        setScanMode(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart.length, parkCurrentCart]);

  const tx = lastTxId ? transactions.find((t) => t.id === lastTxId) : null;

  const handleCheckout = () => setPayOpen(true);
  const handleOpenParked = () => setParkedOpen(true);

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-col gap-3 border-b px-4 py-4 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Cari nama / SKU / scan barcode (F2)"
                className="pl-9"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleScanSubmit(query);
                    setQuery("");
                  }
                }}
              />
            </div>
            <Button
              variant={scanMode ? "default" : "outline"}
              size="icon"
              onClick={() => setScanMode((v) => !v)}
              title="Mode Scan Barcode (F3)"
              aria-label="Toggle scan mode"
            >
              <ScanBarcode className="h-4 w-4" />
            </Button>
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative lg:hidden"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cart.length > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                      {cart.length}
                    </span>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full p-0 sm:max-w-md">
                <SheetHeader className="sr-only">
                  <SheetTitle>Keranjang</SheetTitle>
                </SheetHeader>
                <CartPanel
                  onCheckout={() => {
                    setCartOpen(false);
                    setPayOpen(true);
                  }}
                  onOpenParked={handleOpenParked}
                />
              </SheetContent>
            </Sheet>
          </div>

          {scanMode ? (
            <div
              className={cn(
                "flex flex-col gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-3 transition-all sm:flex-row sm:items-center",
                scanFlash && "border-success bg-success/10"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <ScanBarcode
                  className={cn("h-5 w-5", scanFlash && "animate-pulse")}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Mode Scan Aktif — arahkan scanner USB ke produk
                </p>
                <p className="text-xs text-muted-foreground">
                  Hasil scan otomatis tersubmit (Enter). Atau ketik manual lalu
                  Enter.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  ref={scanRef}
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onBlur={() => {
                    if (scanMode) {
                      window.setTimeout(() => scanRef.current?.focus(), 50);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleScanSubmit(scanValue);
                    }
                  }}
                  placeholder="🔍 Tunggu scan…"
                  className={cn(
                    "h-10 w-full bg-card font-mono tabular-nums sm:w-56",
                    scanFlash && "ring-2 ring-success"
                  )}
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setScanMode(false)}
                  aria-label="Tutup mode scan"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeCat === "all" ? "default" : "outline"}
              onClick={() => setActiveCat("all")}
            >
              Semua ({products.filter((p) => p.active).length})
            </Button>
            {categories.map((c) => {
              const count = products.filter(
                (p) => p.active && p.categoryId === c.id
              ).length;
              return (
                <Button
                  key={c.id}
                  size="sm"
                  variant={activeCat === c.id ? "default" : "outline"}
                  onClick={() => setActiveCat(c.id)}
                >
                  {c.name} ({count})
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {filtered.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Tidak ada produk.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  disabled={!settings.allowBackorder && p.stock <= 0}
                  onAdd={() => {
                    if (!settings.allowBackorder && p.stock <= 0) {
                      toast.error("Stok habis");
                      return;
                    }
                    addToCart(p.id);
                    toast.success(`${p.name} ditambah`, { duration: 800 });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden w-96 shrink-0 border-l bg-card lg:flex lg:flex-col">
        <CartPanel
          onCheckout={handleCheckout}
          onOpenParked={handleOpenParked}
        />
      </div>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        total={totals.total}
        onConfirm={async (method, paid, note) => {
          try {
            const result = await checkoutViaApi({
              items: cart.map((it) => ({
                productId: it.productId,
                qty: it.qty,
                discount: it.discount ?? 0,
              })),
              discount: cartDiscount,
              method,
              paid,
              customerId: cartCustomerId,
              note,
            });
            setLastTxId(result.id);
            setPayOpen(false);
            toast.success("Transaksi berhasil");
          } catch (err) {
            const msg =
              err instanceof ApiError
                ? err.message
                : err instanceof Error
                ? err.message
                : "Gagal membuat transaksi";
            toast.error(msg);
          }
        }}
      />

      <Dialog
        open={!!tx}
        onOpenChange={(o) => {
          if (!o) setLastTxId(null);
        }}
      >
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" /> Struk Transaksi
            </DialogTitle>
            <DialogDescription>
              Transaksi berhasil disimpan. Bisa diprint atau ditutup.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-secondary/40 px-6 py-4">
            <div className="rounded-md border bg-white text-black shadow-sm">
              {tx ? <Receipt transaction={tx} /> : null}
            </div>
          </div>
          <DialogFooter className="p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => setLastTxId(null)}
              className="flex-1"
            >
              Tutup
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                window.print();
              }}
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={parkedOpen} onOpenChange={setParkedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cart Diparkir</DialogTitle>
            <DialogDescription>
              {parked.length} cart tersimpan. Pilih untuk dilanjutkan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {parked.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Belum ada cart yang diparkir.
              </p>
            ) : (
              parked.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.items.length} item ·{" "}
                      {customers.find((c) => c.id === p.customerId)?.name ||
                        "Walk-in"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        resumeParked(p.id);
                        setParkedOpen(false);
                        toast.success("Cart dilanjutkan");
                      }}
                    >
                      <PlayCircle className="h-4 w-4" /> Lanjut
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteParked(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CartPanel({
  onCheckout,
  onOpenParked,
}: {
  onCheckout: () => void;
  onOpenParked: () => void;
}) {
  const cart = useStore((s) => s.cart);
  const cartCustomerId = useStore((s) => s.cartCustomerId);
  const cartDiscount = useStore((s) => s.cartDiscount);
  const parked = useStore((s) => s.parked);
  const products = useStore((s) => s.products);
  const customers = useStore((s) => s.customers);
  const settings = useStore((s) => s.settings);

  const setCartQty = useStore((s) => s.setCartQty);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const setCartDiscount = useStore((s) => s.setCartDiscount);
  const setCartCustomer = useStore((s) => s.setCartCustomer);
  const clearCart = useStore((s) => s.clearCart);
  const parkCurrentCart = useStore((s) => s.parkCurrentCart);
  const totals = useCartTotals();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          <p className="text-sm font-semibold">Keranjang ({cart.length})</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenParked}
            className="text-xs"
          >
            Parked ({parked.length})
          </Button>
          {cart.length > 0 ? (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                clearCart();
                toast.success("Cart dikosongkan");
              }}
              aria-label="Clear cart"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="border-b px-4 py-3">
        <Label className="mb-1 block text-xs text-muted-foreground">
          Pelanggan
        </Label>
        <Select
          value={cartCustomerId || "walkin"}
          onValueChange={(v) =>
            setCartCustomer(v === "walkin" ? undefined : v)
          }
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="walkin">Walk-in customer</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <ShoppingCart className="h-10 w-10 opacity-30" />
            <p>Keranjang masih kosong</p>
            <p className="text-xs">Pilih produk dari grid di kiri</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map((it) => {
              const p = products.find((x) => x.id === it.productId);
              if (!p) return null;
              return (
                <div
                  key={it.productId}
                  className="rounded-md border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(it.price)} / {p.unit}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => removeFromCart(it.productId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-md border bg-card">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setCartQty(it.productId, it.qty - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        value={it.qty}
                        onChange={(e) => {
                          const n = parseInt(e.target.value || "0", 10);
                          setCartQty(it.productId, isNaN(n) ? 0 : n);
                        }}
                        className="h-8 w-12 border-0 p-0 text-center tabular-nums focus-visible:ring-0 focus-visible:ring-offset-0"
                        inputMode="numeric"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setCartQty(it.productId, it.qty + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(it.price * it.qty)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t bg-card px-4 py-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Diskon</span>
            <Input
              type="number"
              value={cartDiscount}
              min={0}
              onChange={(e) =>
                setCartDiscount(Math.max(0, Number(e.target.value || 0)))
              }
              className="h-7 w-32 text-right tabular-nums"
            />
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Pajak ({settings.taxRate}%)
            </span>
            <span className="tabular-nums">{formatCurrency(totals.tax)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
          <span className="text-sm font-semibold text-primary">Total</span>
          <span className="text-lg font-bold tabular-nums text-primary">
            {formatCurrency(totals.total)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={cart.length === 0}
            onClick={() => {
              parkCurrentCart();
              toast.success("Cart diparkir (F8)");
            }}
          >
            <PauseCircle className="h-4 w-4" /> Park
          </Button>
          <Button
            className="flex-[2]"
            disabled={cart.length === 0}
            onClick={onCheckout}
          >
            <Calculator className="h-4 w-4" /> Bayar (F4)
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onAdd,
  disabled,
}: {
  product: Product;
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "opacity-50"
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-primary/10 via-secondary to-secondary">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-4">
            <span className="text-4xl font-bold text-primary/40">
              {product.name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")
                .toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute right-2 top-2">
          <StockBadge stock={product.stock} minStock={product.minStock} />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight">
          {product.name}
        </p>
        <p className="text-sm font-semibold tabular-nums text-primary">
          {formatCurrency(product.price)}
        </p>
        <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {product.barcode || product.sku}
        </p>
        <p className="text-xs text-muted-foreground">
          {product.sku} · stok {product.stock} {product.unit}
        </p>
      </div>
    </button>
  );
}

function PaymentDialog({
  open,
  onOpenChange,
  total,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  total: number;
  onConfirm: (m: PaymentMethod, paid: number, note?: string) => void;
}) {
  const settings = useStore((s) => s.settings);
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  const [paid, setPaid] = React.useState<number>(0);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setPaid(total);
      setNote("");
      setMethod(settings.enableMethods[0] || "cash");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const change = paid - total;
  const quickAmounts = React.useMemo(() => {
    const base = [total];
    const ceilTo = (n: number, m: number) => Math.ceil(n / m) * m;
    base.push(ceilTo(total, 5000));
    base.push(ceilTo(total, 10000));
    base.push(ceilTo(total, 50000));
    base.push(ceilTo(total, 100000));
    return Array.from(new Set(base))
      .filter((n) => n >= total)
      .slice(0, 5);
  }, [total]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pembayaran</DialogTitle>
          <DialogDescription>
            Total tagihan{" "}
            <span className="font-semibold text-primary">
              {formatCurrency(total)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Metode Pembayaran</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {settings.enableMethods.map((m) => {
                const Icon = methodIcons[m];
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border p-3 text-sm font-medium transition-colors",
                      method === m
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-accent"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="capitalize">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {method === "cash" ? (
            <>
              <div>
                <Label className="mb-2 block">Jumlah Bayar</Label>
                <Input
                  type="number"
                  value={paid}
                  onChange={(e) => setPaid(Number(e.target.value || 0))}
                  className="h-12 text-right text-xl font-semibold tabular-nums"
                  inputMode="numeric"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((q) => (
                  <Button
                    key={q}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPaid(q)}
                  >
                    {formatCurrency(q)}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPaid(total)}
                >
                  Pas
                </Button>
              </div>
              <div className="rounded-md border bg-secondary/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Kembalian
                  </span>
                  <span
                    className={cn(
                      "text-xl font-bold tabular-nums",
                      change < 0 ? "text-destructive" : "text-success"
                    )}
                  >
                    {formatCurrency(change < 0 ? 0 : change)}
                  </span>
                </div>
                {change < 0 ? (
                  <p className="mt-1 text-xs text-destructive">
                    Kurang {formatCurrency(-change)}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="rounded-md border bg-secondary/40 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Pembayaran via {method.toUpperCase()}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {formatCurrency(total)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Konfirmasi pembayaran sudah diterima sebelum lanjut.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="note" className="mb-2 block">
              Catatan (opsional)
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan internal"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            disabled={method === "cash" ? paid < total : false}
            onClick={() =>
              onConfirm(
                method,
                method === "cash" ? paid : total,
                note || undefined
              )
            }
          >
            Konfirmasi Bayar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
