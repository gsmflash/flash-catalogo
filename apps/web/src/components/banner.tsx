"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { StoreSettings } from "@/types";

export function Banner({ settings }: { settings: StoreSettings }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative aspect-[16/6] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary/60 sm:aspect-[21/6]"
    >
      {settings.bannerUrl ? (
        <Image
          src={settings.bannerUrl}
          alt={settings.storeName}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-primary-foreground">
          <h1 className="text-2xl font-bold sm:text-4xl">{settings.storeName}</h1>
          <p className="max-w-lg text-sm text-primary-foreground/80 sm:text-base">
            Os melhores celulares com o melhor preço e parcelamento.
          </p>
        </div>
      )}
    </motion.div>
  );
}
