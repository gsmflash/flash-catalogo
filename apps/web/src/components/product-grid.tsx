import type { PaymentMachine, Product } from "@/types";
import { ProductCard } from "@/components/product-card";

interface ProductGridProps {
  products: Product[];
  whatsapp: string;
  machines: PaymentMachine[];
}

export function ProductGrid({ products, whatsapp, machines }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-border bg-secondary/30 py-24 text-center">
        <p className="text-lg font-medium">Nenhum produto encontrado</p>
        <p className="text-sm text-muted-foreground">Tente ajustar a busca ou escolher outra categoria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} whatsapp={whatsapp} machines={machines} />
      ))}
    </div>
  );
}
