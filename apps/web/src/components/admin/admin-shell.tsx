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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-secondary/30 md:flex">
        <div className="flex h-16 items-center px-6 font-bold text-lg">Flash Cell Admin</div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {visibleItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-4">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start gap-2 px-2" onClick={logout}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden">
          <span className="font-bold">Flash Cell Admin</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto border-b border-border p-2 md:hidden">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium",
                pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground"
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
