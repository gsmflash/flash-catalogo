"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  CreditCard,
  Calculator,
  Settings,
  Users,
  LogOut,
  Loader2,
  Wallet,
  ChevronDown,
  ArrowDownCircle,
  ArrowUpCircle,
  Receipt,
  FileClock,
  Target,
  HandCoins,
  PiggyBank,
  FileBarChart,
  SlidersHorizontal,
  ShoppingCart,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "editor"] },
  { href: "/admin/produtos", label: "Produtos", icon: Package, roles: ["admin", "editor"] },
  { href: "/admin/categorias", label: "Categorias", icon: FolderTree, roles: ["admin", "editor"] },
  { href: "/admin/operadoras", label: "Operadoras", icon: CreditCard, roles: ["admin"] },
  { href: "/admin/simulador", label: "Simulador", icon: Calculator, roles: ["admin"] },
  {
    href: "/admin/financeiro",
    label: "Financeiro",
    icon: Wallet,
    roles: ["admin"],
    children: [
      { href: "/admin/financeiro", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
      { href: "/admin/financeiro/fluxo-de-caixa", label: "Fluxo de Caixa", icon: FileClock, roles: ["admin"] },
      { href: "/admin/financeiro/entradas", label: "Entradas", icon: ArrowDownCircle, roles: ["admin"] },
      { href: "/admin/financeiro/saidas", label: "Saídas", icon: ArrowUpCircle, roles: ["admin"] },
      { href: "/admin/financeiro/contas-a-pagar", label: "Contas a Pagar", icon: Receipt, roles: ["admin"] },
      { href: "/admin/financeiro/contas-a-receber", label: "Contas a Receber", icon: Receipt, roles: ["admin"] },
      { href: "/admin/financeiro/reservas", label: "Reservas", icon: PiggyBank, roles: ["admin"] },
      { href: "/admin/financeiro/emprestimos", label: "Empréstimos", icon: HandCoins, roles: ["admin"] },
      { href: "/admin/financeiro/orcamentos", label: "Orçamentos", icon: Target, roles: ["admin"] },
      { href: "/admin/financeiro/relatorios", label: "Relatórios", icon: FileBarChart, roles: ["admin"] },
      { href: "/admin/financeiro/configuracoes", label: "Configurações", icon: SlidersHorizontal, roles: ["admin"] },
    ],
  },
  {
    href: "/admin/pagamentos",
    label: "Pagamentos",
    icon: ShoppingCart,
    roles: ["admin"],
    children: [
      { href: "/admin/pagamentos/pedidos", label: "Pedidos", icon: ClipboardList, roles: ["admin"] },
      { href: "/admin/pagamentos/configuracoes", label: "Configurações", icon: SlidersHorizontal, roles: ["admin"] },
    ],
  },
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

  const visibleItems = navItems
    .filter((item) => item.roles.includes(user.role))
    .map((item) => ({ ...item, children: item.children?.filter((child) => child.roles.includes(user.role)) }));

  return (
    <div className="flex min-h-screen bg-secondary/20">
      <aside className="hidden w-64 shrink-0 flex-col bg-ink text-ink-foreground md:flex">
        <div className="flex h-20 items-center gap-2.5 px-6">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">F</span>
          <span className="text-lg font-semibold">Flash Cell</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {visibleItems.map((item) =>
            item.children ? (
              <NavGroup key={item.href} item={item} pathname={pathname} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          )}
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
          {visibleItems.map((item) => {
            const active = item.children
              ? pathname === item.href || pathname.startsWith(item.href + "/")
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-white/60"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const isWithinGroup = pathname === item.href || pathname.startsWith(item.href + "/");
  const [open, setOpen] = useState(isWithinGroup);

  useEffect(() => {
    if (isWithinGroup) setOpen(true);
  }, [isWithinGroup]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
          isWithinGroup ? "bg-primary/15 text-primary" : "text-white/60 hover:bg-white/5 hover:text-white"
        )}
      >
        <item.icon className="size-4" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-4">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === child.href
                  ? "bg-primary text-primary-foreground shadow-gold"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              )}
            >
              <child.icon className="size-3.5" />
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
