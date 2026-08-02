import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCT_STATUS_LABELS } from "@flashcell/shared";
import { getProductBySlug, getSettings, NotFoundError } from "@/lib/api";
import { ProductGallery } from "@/components/product-gallery";
import { InstallmentTable } from "@/components/installment-table";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ShareButton } from "@/components/share-button";
import { ProductGrid } from "@/components/product-grid";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function loadProduct(slug: string) {
  try {
    return await getProductBySlug(slug);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await loadProduct(slug);
  const title = `${product.brand} ${product.model} ${product.storage} ${product.color}`;
  const description = product.description || `${title} disponível na Flash Cell a partir de ${formatBRL(product.pricePix)} no Pix.`;
  const image = product.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

const availabilityMap: Record<string, string> = {
  disponivel: "https://schema.org/InStock",
  ultima_unidade: "https://schema.org/LimitedAvailability",
  em_breve: "https://schema.org/PreOrder",
  vendido: "https://schema.org/SoldOut",
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([loadProduct(slug), getSettings()]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.model} ${product.storage} ${product.color}`,
    brand: { "@type": "Brand", name: product.brand },
    image: product.images.map((img) => img.url),
    description: product.description || undefined,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/produto/${product.slug}`,
      priceCurrency: "BRL",
      price: product.pricePix,
      availability: availabilityMap[product.status],
      seller: { "@type": "Organization", name: settings.storeName },
    },
  };

  return (
    <div className="container flex flex-col gap-10 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} alt={`${product.brand} ${product.model}`} />

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{PRODUCT_STATUS_LABELS[product.status]}</Badge>
            <ShareButton title={`${product.brand} ${product.model}`} text={`Confira ${product.brand} ${product.model} na ${settings.storeName}`} />
          </div>

          <div>
            <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</span>
            <h1 className="text-2xl font-bold sm:text-3xl">{product.model}</h1>
            <p className="mt-1 text-muted-foreground">
              {product.color} · {product.storage}
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold text-primary">{formatBRL(product.pricePix)}</p>
            <p className="text-sm text-muted-foreground">no Pix</p>
          </div>

          <WhatsAppButton
            phone={settings.whatsapp}
            brand={product.brand}
            model={product.model}
            storage={product.storage}
            size="lg"
            className="w-full sm:w-auto"
          />

          <InstallmentTable pricing={product.pricing} />

          {product.description && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-line text-sm text-muted-foreground">{product.description}</p>
            </div>
          )}

          {Object.keys(product.specifications).length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <h2 className="mb-3 font-semibold">Especificações</h2>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2 border-b border-border/60 py-1">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {product.related.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Produtos relacionados</h2>
          <ProductGrid products={product.related} whatsapp={settings.whatsapp} />
        </section>
      )}
    </div>
  );
}
