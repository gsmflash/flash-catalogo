"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryNavProps {
  categories: Category[];
  className?: string;
  dark?: boolean;
}

export function CategoryNav({ categories, className, dark }: CategoryNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") ?? "";
  const q = searchParams.get("q");

  const buildHref = (categorySlug?: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categorySlug) params.set("category", categorySlug);
    const qs = params.toString();
    return `/${qs ? `?${qs}` : ""}`;
  };

  const isHome = pathname === "/";

  const chipBase = "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200";
  const chipInactive = dark
    ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
    : "border-border bg-background text-foreground hover:bg-secondary";
  const chipActive = "border-primary bg-primary text-primary-foreground shadow-gold";

  return (
    <nav className={cn("scrollbar-none flex gap-2 overflow-x-auto pb-1", className)}>
      <Link href={buildHref()} className={cn(chipBase, isHome && !activeCategory ? chipActive : chipInactive)}>
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={buildHref(category.slug)}
          className={cn(chipBase, isHome && activeCategory === category.slug ? chipActive : chipInactive)}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
