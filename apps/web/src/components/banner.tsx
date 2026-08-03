"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@flashcell/shared";
import { Button } from "@/components/ui/button";
import type { StoreSettings } from "@/types";

export function Banner({ settings }: { settings: StoreSettings }) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const whatsappHref = buildWhatsAppLink(
    settings.whatsapp,
    "Olá! Vim pelo site da Flash Cell e gostaria de mais informações."
  );

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden bg-ink text-ink-foreground">
      {settings.bannerUrl ? (
        <>
          <motion.div style={{ y: imageY }} className="absolute inset-0 scale-110">
            <Image src={settings.bannerUrl} alt={settings.storeName} fill priority sizes="100vw" className="object-cover" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
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

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="container relative flex min-h-[30rem] flex-col items-center justify-center gap-6 py-24 text-center sm:min-h-[36rem]"
      >
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
          className="max-w-3xl text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl"
        >
          Os melhores smartphones com <span className="gold-gradient-text">garantia</span> e procedência.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-xl text-balance text-lg text-white/70 sm:text-xl"
        >
          Especialistas em Xiaomi, iPhone e Samsung.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-3 flex flex-wrap items-center justify-center gap-3"
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
      </motion.div>
    </section>
  );
}
