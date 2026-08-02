"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { PRODUCT_STATUS_LABELS } from "@flashcell/shared";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  whatsapp: string;
}

const statusVariant: Record<string, string> = {
  disponivel: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  ultima_unidade: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  em_breve: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  vendido: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
};

export function ProductCard({ product, whatsapp }: ProductCardProps) {
  const mainImage = product.images.find((img) => img.isMain) ?? product.images[0];
  const maxInstallment = product.pricing
    .filter((p) => p.method === "credito")
    .reduce((best, curr) => (curr.installments > (best?.installments ?? 0) ? curr : best), product.pricing[0]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <Link href={`/produto/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden bg-secondary">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={`${product.brand} ${product.model}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
              Sem imagem
            </div>
          )}
          <Badge
            variant="outline"
            className={cn("absolute left-3 top-3 border backdrop-blur", statusVariant[product.status])}
          >
            {PRODUCT_STATUS_LABELS[product.status]}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.brand}</span>
          <h3 className="font-semibold leading-tight">{product.model}</h3>
          <p className="text-sm text-muted-foreground">
            {product.color} · {product.storage}
          </p>

          <div className="mt-3 space-y-0.5">
            <p className="text-lg font-bold text-primary">{formatBRL(product.pricePix)} no Pix</p>
            {maxInstallment && (
              <p className="text-xs text-muted-foreground">
                ou {maxInstallment.installments}x de {formatBRL(maxInstallment.perInstallment)} no cartão
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4 pt-0">
        <WhatsAppButton
          phone={whatsapp}
          brand={product.brand}
          model={product.model}
          storage={product.storage}
          className="w-full"
          size="sm"
        />
      </div>
    </motion.div>
  );
}
