"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, FolderTree, CheckCircle2, Clock, Star } from "lucide-react";
import { PRODUCT_STATUS_LABELS } from "@flashcell/shared";
import { adminFetch } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/format";
import type { AdminProduct, Category } from "@/types";

export default function DashboardPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);

  useEffect(() => {
    adminFetch<AdminProduct[]>("/products/admin").then(setProducts).catch(() => setProducts([]));
    adminFetch<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  const counts = {
    disponivel: products?.filter((p) => p.status === "disponivel").length ?? 0,
    ultima_unidade: products?.filter((p) => p.status === "ultima_unidade").length ?? 0,
    em_breve: products?.filter((p) => p.status === "em_breve").length ?? 0,
    vendido: products?.filter((p) => p.status === "vendido").length ?? 0,
  };

  const stats = [
    { label: "Total de produtos", value: products?.length ?? "—", icon: Package },
    { label: "Categorias", value: categories?.length ?? "—", icon: FolderTree },
    { label: "Disponíveis", value: counts.disponivel, icon: CheckCircle2 },
    { label: "Vendidos (histórico)", value: counts.vendido, icon: Star },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos recentes</CardTitle>
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
          {products?.slice(0, 8).map((product) => (
            <Link
              key={product.id}
              href={`/admin/produtos/${product.id}`}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary"
            >
              <span>
                {product.brand} {product.model} — {product.color} · {product.storage}
              </span>
              <span className="flex items-center gap-3 text-muted-foreground">
                {formatBRL(product.pricePix)}
                <span className="flex items-center gap-1 text-xs">
                  <Clock className="size-3" /> {PRODUCT_STATUS_LABELS[product.status]}
                </span>
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
