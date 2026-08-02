"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { PRODUCT_STATUS_LABELS } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import type { AdminProduct } from "@/types";

export default function ProdutosPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);

  function reload() {
    adminFetch<AdminProduct[]>("/products/admin").then(setProducts).catch(() => setProducts([]));
  }

  useEffect(reload, []);

  async function handleDuplicate(id: string) {
    try {
      await adminFetch(`/products/${id}/duplicate`, { method: "POST" });
      toast.success("Produto duplicado");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao duplicar");
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Excluir "${label}" permanentemente?`)) return;
    try {
      await adminFetch(`/products/${id}`, { method: "DELETE" });
      toast.success("Produto excluído");
      setProducts((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <Plus className="size-4" /> Novo produto
          </Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Preço Pix</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            )}
            {products?.map((product) => {
              const mainImage = product.images.find((img) => img.isMain) ?? product.images[0];
              return (
                <tr key={product.id} className="border-t border-border">
                  <td className="flex items-center gap-3 px-4 py-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {mainImage && <Image src={mainImage.url} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium">
                        {product.brand} {product.model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {product.color} · {product.storage}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatBRL(product.pricePix)}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{PRODUCT_STATUS_LABELS[product.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/produtos/${product.id}`} aria-label="Editar">
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDuplicate(product.id)} aria-label="Duplicar">
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, `${product.brand} ${product.model}`)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
