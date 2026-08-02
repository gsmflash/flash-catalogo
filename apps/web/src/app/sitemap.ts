import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/api";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { items } = await getProducts({ pageSize: 60 });

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    ...items.map((product) => ({
      url: `${siteUrl}/produto/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
