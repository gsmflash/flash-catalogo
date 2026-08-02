"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, FolderTree, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { PRODUCT_STATUS_LABELS, PRODUCT_STATUSES, type ProductStatus } from "@flashcell/shared";
import { adminFetch } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusChart } from "@/components/admin/status-chart";
import { formatBRL } from "@/lib/format";
import type { AdminProduct, Category } from "@/types";

const statusDotColor: Record<ProductStatus, string> = {
  disponivel: "#D4AF37",
  ultima_unidade: "#B8922A",
  em_breve: "#8F7020",
  vendido: "#3D3010",
};

export default function DashboardPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    adminFetch<AdminProduct[]>("/products/admin").then(setProducts).catch(() => setProducts([]));
    adminFetch<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  const counts = PRODUCT_STATUSES.reduce(
    (acc, status) => {
      acc[status] = products?.filter((p) => p.status === status).length ?? 0;
      return acc;
    },
    {} as Record<ProductStatus, number>
  );

  const stats = [
    { label: "Total de produtos", value: products?.length ?? "—", icon: Package },
    { label: "Categorias", value: categories?.length ?? "—", icon: FolderTree },
    { label: "Disponíveis", value: counts.disponivel, icon: CheckCircle2 },
    { label: "Vendidos (histórico)", value: counts.vendido, icon: Sparkles },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do catálogo Flash Cell.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <stat.icon className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Status dos produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart counts={counts} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PRODUCT_STATUSES.map((status) => (
                <div key={status} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: statusDotColor[status] }} />
                  <span className="text-muted-foreground">{PRODUCT_STATUS_LABELS[status]}</span>
                  <span className="ml-auto font-medium">{counts[status]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Produtos recentes</CardTitle>
            <Link href="/admin/produtos" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todos <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {products === null && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {products?.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhum produto cadastrado ainda.{" "}
                <Link href="/admin/produtos/novo" className="text-primary underline">
                  Cadastrar o primeiro
                </Link>
              </p>
            )}
            {products?.slice(0, 6).map((product) => (
              <Link
                key={product.id}
                href={`/admin/produtos/${product.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <span className="truncate">
                  {product.brand} {product.model} — {product.color} · {product.storage}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-medium text-primary">{formatBRL(product.pricePix)}</span>
                  <Badge variant="outline" className="border-border text-xs">
                    {PRODUCT_STATUS_LABELS[product.status]}
                  </Badge>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
