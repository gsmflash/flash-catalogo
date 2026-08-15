"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { PRODUCT_STATUS_LABELS } from "@flashcell/shared";
import type { PaymentMachine, Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { PurchaseDialog } from "@/components/purchase-dialog";
import { InstallmentDialog } from "@/components/installment-dialog";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  whatsapp: string;
  machines: PaymentMachine[];
}

const statusVariant: Record<string, string> = {
  disponivel: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  ultima_unidade: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  em_breve: "bg-neutral-500/15 text-neutral-300 border-neutral-500/25",
  vendido: "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
};

export function ProductCard({ product, whatsapp, machines }: ProductCardProps) {
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
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-primary/15 bg-[#1a1a1a] shadow-premium transition-all duration-300 hover:border-primary/30 hover:shadow-gold"
    >
      <Link href={`/produto/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-black/40">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={`${product.brand} ${product.model}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/40">Sem imagem</div>
          )}

          <Badge
            variant="outline"
            className={cn("absolute left-3 top-3 border backdrop-blur", statusVariant[product.status])}
          >
            {PRODUCT_STATUS_LABELS[product.status]}
          </Badge>

          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-primary/30 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-primary backdrop-blur">
            <ShieldCheck className="size-3.5" /> Garantia
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-5 sm:p-6">
          <span className="text-xs font-medium uppercase tracking-wider text-white/45">{product.brand}</span>
          <h3 className="text-xl font-semibold leading-tight text-white sm:text-2xl">{product.model}</h3>
          <p className="text-sm text-white/50">
            {product.color} · <span className="font-medium text-white/80">{product.storage}</span>
          </p>

          <div className="mt-4 space-y-0.5">
            <p className="text-2xl font-bold text-primary sm:text-3xl">{formatBRL(product.pricePix)}</p>
            <p className="text-xs text-white/40">à vista no Pix</p>
            {maxInstallment && (
              <p className="text-xs text-white/40">
                ou {maxInstallment.installments}x de {formatBRL(maxInstallment.perInstallment)} no cartão
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-2.5 p-5 pt-0 sm:p-6 sm:pt-0">
        <InstallmentDialog
          productName={`${product.brand} ${product.model}`}
          price={product.price}
          machines={machines}
          defaultMachineId={product.machineId}
          className="w-full border-primary/25 bg-primary/5 text-primary hover:bg-primary/10"
        />
        <PurchaseDialog
          product={{
            id: product.id,
            brand: product.brand,
            model: product.model,
            color: product.color,
            storage: product.storage,
            price: product.price,
            imageUrl: mainImage?.url,
          }}
          whatsapp={whatsapp}
          triggerSize="lg"
          triggerClassName="w-full gap-2"
        />
      </div>
    </motion.div>
  );
}
