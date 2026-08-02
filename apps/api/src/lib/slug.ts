import slugify from "slugify";
import { eq, ne, and } from "drizzle-orm";
import { db } from "../db/client.js";
import { products } from "../db/schema.js";

export function slugifyText(value: string): string {
  return slugify(value, { lower: true, strict: true, locale: "pt" });
}

/** Generates a unique product slug from brand/model/color/storage, appending -2, -3... on collision. */
export async function generateUniqueProductSlug(
  parts: { brand: string; model: string; color: string; storage: string },
  excludeId?: string
): Promise<string> {
  const base = slugifyText(`${parts.brand}-${parts.model}-${parts.color}-${parts.storage}`);
  let candidate = base;
  let attempt = 1;

  while (true) {
    const conflictQuery = excludeId
      ? and(eq(products.slug, candidate), ne(products.id, excludeId))
      : eq(products.slug, candidate);

    const [existing] = await db.select({ id: products.id }).from(products).where(conflictQuery).limit(1);
    if (!existing) return candidate;

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}
