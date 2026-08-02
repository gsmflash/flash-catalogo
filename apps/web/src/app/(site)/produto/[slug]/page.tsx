import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { PRODUCT_STATUS_LABELS } from "@flashcell/shared";
import { getProductBySlug, getSettings, NotFoundError } from "@/lib/api";
import { ProductGallery } from "@/components/product-gallery";
import { InstallmentTable } from "@/components/installment-table";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ShareButton } from "@/components/share-button";
import { ProductGrid } from "@/components/product-grid";
import { StickyWhatsApp } from "@/components/sticky-whatsapp";
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
    <div className="container flex flex-col gap-14 py-8 pb-28 sm:py-12 lg:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <ProductGallery images={product.images} alt={`${product.brand} ${product.model}`} />

        <div className="flex flex-col gap-5 lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              {PRODUCT_STATUS_LABELS[product.status]}
            </Badge>
            <ShareButton title={`${product.brand} ${product.model}`} text={`Confira ${product.brand} ${product.model} na ${settings.storeName}`} />
          </div>

          <div>
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.model}</h1>
            <p className="mt-1.5 text-muted-foreground">
              {product.color} · {product.storage}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-5">
            <p className="text-4xl font-bold text-primary">{formatBRL(product.pricePix)}</p>
            <p className="text-sm text-muted-foreground">à vista no Pix</p>

            <div className="mt-4 hidden sm:block">
              <WhatsAppButton
                phone={settings.whatsapp}
                brand={product.brand}
                model={product.model}
                storage={product.storage}
                size="lg"
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary">
            <ShieldCheck className="size-4" /> Garantia e procedência Flash Cell
          </div>

          <InstallmentTable pricing={product.pricing} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-6">
          {product.description && (
            <div>
              <h2 className="mb-3 text-lg font-semibold">Descrição</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>

        {Object.keys(product.specifications).length > 0 && (
          <div className="rounded-2xl border border-border p-5">
            <h2 className="mb-3 font-semibold">Especificações</h2>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2 border-b border-border/60 py-2 last:border-0">
                  <dt className="text-muted-foreground">{key}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {product.related.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Produtos relacionados</h2>
          <ProductGrid products={product.related} whatsapp={settings.whatsapp} />
        </section>
      )}

      <StickyWhatsApp
        phone={settings.whatsapp}
        brand={product.brand}
        model={product.model}
        storage={product.storage}
        price={formatBRL(product.pricePix)}
      />
    </div>
  );
}
