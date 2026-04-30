"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Receipt,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Kasir", icon: ShoppingCart, highlight: true },
  { href: "/products", label: "Produk", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/transactions", label: "Transaksi", icon: Receipt },
  { href: "/customers", label: "Pelanggan", icon: Users },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const settings = useStore((s) => s.settings);

  return (
    <aside className="flex h-full w-full flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-3 border-b px-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center">
          <Image
            src="/taka-logo.png"
            alt="TAKA Store"
            width={48}
            height={48}
            className="h-full w-full object-contain drop-shadow-sm"
            priority
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-tight tracking-tight">
            {settings.storeName}
          </p>
          <p className="truncate text-xs text-muted-foreground">POS System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                item.highlight && !active && "text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-4 py-3 text-xs text-muted-foreground">
        Versi 1.0.0 · Phase 1
      </div>
    </aside>
  );
}
