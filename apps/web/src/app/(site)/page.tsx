import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getProducts, getSettings } from "@/lib/api";
import { Banner } from "@/components/banner";
import { CategoryNav } from "@/components/category-nav";
import { SearchBar } from "@/components/search-bar";
import { ProductGrid } from "@/components/product-grid";

export const metadata: Metadata = {
  description: "Catálogo de celulares Flash Cell: iPhone, Xiaomi, Samsung e Motorola com os melhores preços e parcelamento.",
};

interface HomePageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q, category } = await searchParams;

  const [settings, categories, productsResponse] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ q, category, pageSize: 48 }),
  ]);

  return (
    <div className="container flex flex-col gap-8 py-6">
      <Banner settings={settings} />

      <Suspense fallback={null}>
        <div className="flex flex-col gap-4 md:hidden">
          <SearchBar />
        </div>

        <CategoryNav categories={categories} className="md:hidden" />
      </Suspense>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {q ? `Resultados para "${q}"` : category ? categories.find((c) => c.slug === category)?.name : "Todos os aparelhos"}
          </h2>
          <span className="text-sm text-muted-foreground">{productsResponse.total} produtos</span>
        </div>

        <ProductGrid products={productsResponse.items} whatsapp={settings.whatsapp} />
      </section>
    </div>
  );
}
