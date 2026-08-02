"use client";

import { use, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { ProductForm } from "@/components/admin/product-form";
import type { AdminProduct } from "@/types";

export default function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    adminFetch<AdminProduct>(`/products/admin/${id}`)
      .then(setProduct)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return <p className="text-muted-foreground">Produto não encontrado.</p>;
  }

  if (!product) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Editar produto</h1>
      <ProductForm initialProduct={product} />
    </div>
  );
}
