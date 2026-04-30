"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Barcode } from "@/components/barcode";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageBody, PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export default function LabelsPage() {
  const products = useStore((s) => s.products);
  const settings = useStore((s) => s.settings);
  const [selected, setSelected] = React.useState<Record<string, number>>({});
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.filter((p) => p.active);
    return products.filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode || "").includes(q))
    );
  }, [products, query]);

  const labels = React.useMemo(() => {
    const list: { id: string; copy: number }[] = [];
    Object.entries(selected).forEach(([id, qty]) => {
      if (qty > 0) {
        for (let i = 0; i < qty; i++) list.push({ id, copy: i });
      }
    });
    return list
      .map(({ id, copy }) => {
        const p = products.find((x) => x.id === id);
        return p ? { product: p, copy } : null;
      })
      .filter(Boolean) as { product: (typeof products)[number]; copy: number }[];
  }, [selected, products]);

  const totalLabels = labels.length;

  function setQty(id: string, qty: number) {
    setSelected((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  }

  function selectAll(n: number) {
    const obj: Record<string, number> = {};
    filtered.forEach((p) => (obj[p.id] = n));
    setSelected(obj);
  }

  return (
    <>
      <PageHeader
        title="Cetak Label Barcode"
        description="Pilih produk & jumlah label, lalu cetak ke kertas A4 / printer label."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/products">
                <ArrowLeft className="h-4 w-4" /> Kembali
              </Link>
            </Button>
            <Button
              onClick={() => window.print()}
              disabled={totalLabels === 0}
            >
              <Printer className="h-4 w-4" /> Cetak ({totalLabels})
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="grid gap-4 lg:grid-cols-[400px_1fr] print:block">
          {/* Picker — hidden on print */}
          <Card className="print:hidden">
            <CardContent className="space-y-3 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari produk"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => selectAll(1)}
                >
                  Semua ×1
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected({})}
                >
                  Bersihkan
                </Button>
              </div>
              <div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm",
                      (selected[p.id] || 0) > 0 && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {p.barcode || p.sku} · {formatCurrency(p.price)}
                      </p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 w-16 text-center tabular-nums"
                      value={selected[p.id] || 0}
                      onChange={(e) => setQty(p.id, Number(e.target.value || 0))}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sheet preview */}
          <Card className="print:border-0 print:shadow-none">
            <CardContent className="p-4 print:p-0">
              <div className="mb-3 flex items-center justify-between print:hidden">
                <Label className="text-sm font-medium">
                  Preview Lembar ({totalLabels} label)
                </Label>
                <span className="text-xs text-muted-foreground">
                  Layout: 4 kolom, ukuran ~50×30mm per label
                </span>
              </div>
              {totalLabels === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  Pilih produk di kiri untuk memulai.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-4 print:gap-1">
                  {labels.map((l, idx) => (
                    <div
                      key={`${l.product.id}-${idx}`}
                      className="flex flex-col items-center gap-1 rounded border bg-white p-2 text-center text-black break-inside-avoid print:rounded-none print:border-black print:p-1"
                      style={{ minHeight: 110 }}
                    >
                      <p className="line-clamp-2 w-full text-[11px] font-semibold leading-tight">
                        {l.product.name}
                      </p>
                      <p className="text-[10px] text-neutral-600">
                        {settings.storeName}
                      </p>
                      <div className="flex justify-center">
                        <Barcode
                          value={l.product.barcode || l.product.sku}
                          height={30}
                          fontSize={9}
                          width={1.2}
                          lineColor="#000"
                          background="#fff"
                        />
                      </div>
                      <p className="text-xs font-bold tabular-nums">
                        {formatCurrency(l.product.price)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageBody>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 8mm;
          }
          aside,
          header {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </>
  );
}
