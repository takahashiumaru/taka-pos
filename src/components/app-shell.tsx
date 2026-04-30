"use client";

import * as React from "react";
import { Menu, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { syncFromServer } from "@/lib/sync";
import { getToken } from "@/lib/api";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const hydrated = useStore((s) => s.hydrated);
  const currentUserId = useStore((s) => s.currentUserId);
  const router = useRouter();

  // Auth guard: redirect to /login if no JWT or no currentUserId
  React.useEffect(() => {
    if (!hydrated) return;
    const token = getToken();
    if (!token || !currentUserId) {
      window.location.assign("/login");
    }
  }, [hydrated, currentUserId]);

  // On first mount with valid token, refresh data from server
  React.useEffect(() => {
    if (!hydrated) return;
    const token = getToken();
    if (token && currentUserId) {
      syncFromServer().catch(() => {
        // token might be expired — force logout
        toast.error("Sesi berakhir, silakan login kembali");
        window.location.assign("/login");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "F2") {
        e.preventDefault();
        router.push("/pos");
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden w-64 shrink-0 lg:block">
        <AppSidebar />
      </div>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <AppSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-card/60 px-4 backdrop-blur lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden flex-1 items-center md:flex">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari produk, transaksi… (tekan F2 untuk kasir)"
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push("/pos");
                  }
                }}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="Sinkronkan dari server"
              disabled={syncing}
              onClick={async () => {
                setSyncing(true);
                try {
                  await syncFromServer();
                  toast.success("Data tersinkronisasi");
                } catch {
                  toast.error("Gagal sinkronisasi");
                } finally {
                  setSyncing(false);
                }
              }}
            >
              <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            </Button>
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          {hydrated ? (
            children
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Memuat data…
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
