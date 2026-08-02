import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
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
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-lg">
          {settings.logoUrl ? (
            <Image src={settings.logoUrl} alt={settings.storeName} width={36} height={36} className="rounded-lg" />
          ) : (
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              {settings.storeName.charAt(0)}
            </span>
          )}
          <span className="hidden sm:inline">{settings.storeName}</span>
        </Link>

        <Suspense fallback={<div className="hidden flex-1 md:block" />}>
          <div className="hidden flex-1 md:block">
            <SearchBar className="max-w-md" />
          </div>

          <nav className="ml-auto hidden items-center gap-2 md:flex">
            <CategoryNav categories={categories} />
          </nav>
        </Suspense>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto md:hidden">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetTitle>Menu</SheetTitle>
            <Suspense fallback={null}>
              <div className="mt-6 flex flex-col gap-6">
                <SearchBar />
                <CategoryNav categories={categories} className="flex-col items-start" />
              </div>
            </Suspense>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
