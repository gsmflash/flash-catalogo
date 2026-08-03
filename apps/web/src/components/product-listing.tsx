"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductGrid } from "@/components/product-grid";
import type { Product } from "@/types";

type SortOption = "recent" | "price-asc" | "price-desc" | "name";

const sortLabels: Record<SortOption, string> = {
  recent: "Mais recentes",
  "price-asc": "Menor preço",
  "price-desc": "Maior preço",
  name: "Nome (A-Z)",
};

interface ProductListingProps {
  title: string;
  items: Product[];
  total: number;
  whatsapp: string;
}

export function ProductListing({ title, items, total, whatsapp }: ProductListingProps) {
  const [sort, setSort] = useState<SortOption>("recent");

  const sorted = useMemo(() => {
    const copy = [...items];
    switch (sort) {
      case "price-asc":
        return copy.sort((a, b) => Number(a.pricePix) - Number(b.pricePix));
      case "price-desc":
        return copy.sort((a, b) => Number(b.pricePix) - Number(a.pricePix));
      case "name":
        return copy.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
      default:
        return copy;
    }
  }, [items, sort]);

  return (
    <section id="catalogo" className="scroll-mt-24">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {total} {total === 1 ? "aparelho encontrado" : "aparelhos encontrados"}
          </p>
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full gap-2 sm:w-52">
            <ArrowUpDown className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(sortLabels) as SortOption[]).map((key) => (
              <SelectItem key={key} value={key}>
                {sortLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProductGrid products={sorted} whatsapp={whatsapp} />
    </section>
  );
}
