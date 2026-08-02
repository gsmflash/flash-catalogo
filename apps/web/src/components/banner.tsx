"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@flashcell/shared";
import { Button } from "@/components/ui/button";
import type { StoreSettings } from "@/types";

export function Banner({ settings }: { settings: StoreSettings }) {
  const whatsappHref = buildWhatsAppLink(
    settings.whatsapp,
    "Olá! Vim pelo site da Flash Cell e gostaria de mais informações."
  );

  return (
    <section className="relative isolate overflow-hidden bg-ink text-ink-foreground">
      {settings.bannerUrl ? (
        <>
          <Image
            src={settings.bannerUrl}
            alt={settings.storeName}
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
        </>
      ) : (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-primary/20 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -left-40 size-[30rem] rounded-full bg-primary/10 blur-3xl"
          />
        </>
      )}

      <div className="container relative flex min-h-[26rem] flex-col items-center justify-center gap-6 py-20 text-center sm:min-h-[32rem]">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary"
        >
          {settings.storeName}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl"
        >
          Os melhores smartphones com <span className="gold-gradient-text">garantia</span> e procedência.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-xl text-balance text-base text-white/70 sm:text-lg"
        >
          Especialistas em Xiaomi, iPhone e Samsung.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-2 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild size="lg">
            <Link href="#catalogo">
              Ver catálogo <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ink" className="border border-white/20 hover:bg-white/10">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4 text-primary" /> Falar no WhatsApp
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
