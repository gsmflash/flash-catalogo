"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryNavProps {
  categories: Category[];
  className?: string;
}

export function CategoryNav({ categories, className }: CategoryNavProps) {
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

  return (
    <nav className={cn("scrollbar-none flex gap-2 overflow-x-auto pb-1", className)}>
      <Link
        href={buildHref()}
        className={cn(
          "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
          isHome && !activeCategory
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background hover:bg-secondary"
        )}
      >
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={buildHref(category.slug)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            isHome && activeCategory === category.slug
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-secondary"
          )}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
