"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowRight,
  ShoppingCart,
  BarChart3,
  Boxes,
  ScanBarcode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { loginViaApi } from "@/lib/sync";
import { ApiError } from "@/lib/api";

const features = [
  { icon: ShoppingCart, label: "Kasir cepat dengan barcode" },
  { icon: Boxes, label: "Inventory real-time" },
  { icon: BarChart3, label: "Laporan harian otomatis" },
  { icon: ScanBarcode, label: "Scan barcode 1 detik" },
];

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await loginViaApi(email, password);
      toast.success("Selamat datang!");
      window.location.assign("/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Login gagal";
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: Hero */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-emerald-700 p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)]" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center">
            <Image
              src="/taka-logo.png"
              alt="TAKA Store"
              width={64}
              height={64}
              className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
              priority
            />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">TAKA Store</p>
            <p className="text-xs text-primary-foreground/80">Point of Sale System</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> v1.0 — Live backend + frontend
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            Jualan lebih cepat,
            <br />
            <span className="text-emerald-100">stok selalu rapi.</span>
          </h2>
          <p className="max-w-md text-base text-primary-foreground/80">
            POS modern untuk toko Anda. Scan barcode, hitung kembalian, kelola
            inventory, dan pantau penjualan harian — semua data tersimpan di server.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="flex items-center gap-2 rounded-lg bg-white/10 p-3 text-sm backdrop-blur"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-primary-foreground/70">
          <ShieldCheck className="h-4 w-4" />
          Data tersimpan di MySQL · aman &amp; real-time
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:hidden">
            <div className="mx-auto flex h-28 w-28 items-center justify-center">
              <Image
                src="/taka-logo.png"
                alt="TAKA Store"
                width={112}
                height={112}
                className="h-full w-full object-contain drop-shadow-md"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold">TAKA Store POS</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Selamat datang</h2>
            <p className="text-sm text-muted-foreground">
              Masuk dengan akun Anda untuk melanjutkan.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@taka.id"
                className="h-11"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="h-11 w-full" size="lg" disabled={loading}>
              {loading ? "Memuat…" : "Masuk"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} TAKA Store POS
          </p>
        </div>
      </div>
    </div>
  );
}
