import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getPaymentMachines, getProducts, getSettings } from "@/lib/api";
import { Banner } from "@/components/banner";
import { CategoryNav } from "@/components/category-nav";
import { SearchBar } from "@/components/search-bar";
import { ProductListing } from "@/components/product-listing";

export const metadata: Metadata = {
  description: "Catálogo de celulares Flash Cell: iPhone, Xiaomi, Samsung e Motorola com os melhores preços e parcelamento.",
};

interface HomePageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q, category } = await searchParams;

  const [settings, categories, productsResponse, machines] = await Promise.all([
    getSettings(),
    getCategories(),
    getProducts({ q, category, pageSize: 48 }),
    getPaymentMachines(),
  ]);

  const title = q
    ? `Resultados para "${q}"`
    : category
      ? (categories.find((c) => c.slug === category)?.name ?? "Aparelhos")
      : "Todos os aparelhos";

  return (
    <div className="flex flex-col">
      <Banner settings={settings} />

      <div className="container flex flex-col gap-8 py-10 sm:py-14">
        <Suspense fallback={null}>
          <div className="flex flex-col gap-4 md:hidden">
            <SearchBar />
            <CategoryNav categories={categories} />
          </div>
        </Suspense>

        <ProductListing
          title={title}
          items={productsResponse.items}
          total={productsResponse.total}
          whatsapp={settings.whatsapp}
          machines={machines}
        />
      </div>
    </div>
  );
}
