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
    <header className="sticky top-0 z-40 bg-ink text-ink-foreground shadow-premium">
      <div className="container grid h-20 grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={settings.storeName}
              width={40}
              height={40}
              className="rounded-full ring-1 ring-white/10"
            />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-primary font-serif text-lg font-bold text-primary-foreground">
              {settings.storeName.charAt(0)}
            </span>
          )}
          <span className="hidden text-lg font-semibold tracking-wide sm:inline">{settings.storeName}</span>
        </Link>

        <Suspense fallback={<div />}>
          <div className="hidden justify-self-center md:block md:w-full md:max-w-md">
            <SearchBar className="w-full" dark />
          </div>
        </Suspense>

        <div className="flex items-center justify-self-end gap-2">
          <Button asChild variant="ink" size="icon" className="hidden border border-white/10 hover:bg-white/10 sm:inline-flex">
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Falar no WhatsApp">
              <MessageCircle className="size-5 text-primary" />
            </a>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ink" size="icon" className="border border-white/10 hover:bg-white/10 md:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 border-l border-white/10 bg-ink text-ink-foreground">
              <SheetTitle className="text-ink-foreground">Menu</SheetTitle>
              <Suspense fallback={null}>
                <div className="mt-6 flex flex-col gap-6">
                  <SearchBar dark />
                  <CategoryNav categories={categories} className="flex-col items-start" dark />
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                  >
                    <MessageCircle className="size-4" /> Falar no WhatsApp
                  </a>
                </div>
              </Suspense>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Suspense fallback={null}>
        <div className="hidden border-t border-white/10 py-3 md:block">
          <div className="container flex justify-center">
            <CategoryNav categories={categories} dark />
          </div>
        </div>
      </Suspense>
    </header>
  );
}
