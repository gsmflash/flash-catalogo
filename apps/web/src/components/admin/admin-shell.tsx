"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Wallet,
  Settings,
  Users,
  LogOut,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "editor"] },
  { href: "/admin/produtos", label: "Produtos", icon: Package, roles: ["admin", "editor"] },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree, roles: ["admin", "editor"] },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet, roles: ["admin"] },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, roles: ["admin"] },
  { href: "/admin/usuarios", label: "Usuários", icon: Users, roles: ["admin"] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="hidden w-64 shrink-0 flex-col bg-ink text-ink-foreground md:flex">
        <div className="flex h-20 items-center gap-2.5 px-6">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">F</span>
          <span className="text-lg font-semibold">Flash Cell</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-white/40">{user.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-2 px-2 text-white/60 hover:bg-white/5 hover:text-white"
            onClick={logout}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between bg-ink px-4 text-ink-foreground md:hidden">
          <span className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">F</span>
            Flash Cell
          </span>
          <Button variant="ghost" size="sm" onClick={logout} className="text-white/60 hover:bg-white/5 hover:text-white">
            <LogOut className="size-4" />
          </Button>
        </header>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto bg-ink p-2 md:hidden">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                pathname === item.href ? "bg-primary text-primary-foreground" : "text-white/60"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
