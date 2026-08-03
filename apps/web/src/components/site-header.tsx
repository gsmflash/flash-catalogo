import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@flashcell/shared";
import type { Category, StoreSettings } from "@/types";
import { SearchBar } from "@/components/search-bar";
import { CategoryNav } from "@/components/category-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

interface SiteHeaderProps {
  settings: StoreSettings;
  categories: Category[];
}

export function SiteHeader({ settings, categories }: SiteHeaderProps) {
  const whatsappHref = buildWhatsAppLink(
    settings.whatsapp,
    "Olá! Vim pelo site da Flash Cell e gostaria de mais informações."
  );

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-ink text-ink-foreground shadow-premium">
      <div className="container grid h-24 grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          {settings.logoUrl ? (
            <span className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
              <Image src={settings.logoUrl} alt={settings.storeName} fill sizes="56px" className="object-contain" />
            </span>
          ) : (
            <span className="flex size-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground ring-2 ring-primary/30 sm:size-14">
              {settings.storeName.charAt(0)}
            </span>
          )}
          <span className="hidden text-xl font-semibold tracking-wide sm:inline">{settings.storeName}</span>
        </Link>

        <Suspense fallback={<div />}>
          <div className="hidden justify-self-center md:block md:w-full md:max-w-lg">
            <SearchBar className="w-full" dark />
          </div>
        </Suspense>

        <div className="flex items-center justify-self-end gap-2.5">
          <Button
            asChild
            variant="ink"
            size="icon"
            className="hidden border border-white/10 hover:border-primary/30 hover:bg-white/10 sm:inline-flex"
          >
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
              <MessageCircle className="size-5 text-primary" />
            </a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ink" size="icon" className="border border-white/10 hover:border-primary/30 hover:bg-white/10 md:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[85vw] flex-col border-l border-white/10 bg-ink text-ink-foreground sm:w-96">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <span className="relative h-11 w-11 shrink-0">
                    <Image src={settings.logoUrl} alt={settings.storeName} fill sizes="44px" className="object-contain" />
                  </span>
                ) : (
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {settings.storeName.charAt(0)}
                  </span>
                )}
                <SheetTitle className="text-lg text-ink-foreground">{settings.storeName}</SheetTitle>
              </div>

              <Suspense fallback={null}>
                <div className="mt-8 flex flex-1 flex-col gap-8">
                  <SearchBar dark />

                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-medium uppercase tracking-widest text-white/40">Categorias</span>
                    <CategoryNav categories={categories} className="flex-col items-stretch gap-2" dark />
                  </div>

                  <div className="mt-auto">
                    <Button asChild size="lg" className="w-full">
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="size-4" /> Falar no WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              </Suspense>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Suspense fallback={null}>
        <div className="hidden border-t border-white/10 py-3.5 md:block">
          <div className="container flex justify-center">
            <CategoryNav categories={categories} dark />
          </div>
        </div>
      </Suspense>
    </header>
  );
}
