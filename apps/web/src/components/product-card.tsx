"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { PRODUCT_STATUS_LABELS } from "@flashcell/shared";
import type { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  whatsapp: string;
}

const statusVariant: Record<string, string> = {
  disponivel: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  ultima_unidade: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  em_breve: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-500/20",
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
      whileHover={{ y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-premium transition-shadow duration-300 hover:shadow-premium-lg"
    >
      <Link href={`/produto/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={`${product.brand} ${product.model}`}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
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

        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.brand}</span>
          <h3 className="text-lg font-semibold leading-tight">{product.model}</h3>
          <p className="text-sm text-muted-foreground">
            {product.color} · {product.storage}
          </p>

          <div className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <ShieldCheck className="size-3.5" /> Garantia Flash Cell
          </div>

          <div className="mt-3 space-y-0.5">
            <p className="text-xl font-bold text-primary">{formatBRL(product.pricePix)}</p>
            <p className="text-xs text-muted-foreground">no Pix</p>
            {maxInstallment && (
              <p className="text-xs text-muted-foreground">
                ou {maxInstallment.installments}x de {formatBRL(maxInstallment.perInstallment)} no cartão
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-2 p-5 pt-0">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/produto/${product.slug}`}>
            Ver detalhes <ArrowRight className="size-3.5" />
          </Link>
        </Button>
        <WhatsAppButton
          phone={whatsapp}
          brand={product.brand}
          model={product.model}
          storage={product.storage}
          size="icon"
          label={null}
        />
      </div>
    </motion.div>
  );
}
