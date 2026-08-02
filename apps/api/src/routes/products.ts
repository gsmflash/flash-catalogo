import { Router } from "express";
import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { PUBLIC_PRODUCT_STATUSES, productSchema, searchQuerySchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { categories, productImages, products } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { generateUniqueProductSlug } from "../lib/slug.js";
import { getAllFeesByMachine, getFeesForMachine, pricingFor } from "../lib/productPricing.js";

export const productsRouter = Router();

async function attachImages(productIds: string[]) {
  if (productIds.length === 0) return new Map<string, (typeof productImages.$inferSelect)[]>();
  const images = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder));
  const map = new Map<string, (typeof productImages.$inferSelect)[]>();
  for (const img of images) {
    const list = map.get(img.productId) ?? [];
    list.push(img);
    map.set(img.productId, list);
  }
  return map;
}

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = searchQuerySchema.parse(req.query);
    const conditions = [inArray(products.status, PUBLIC_PRODUCT_STATUSES)];

    if (query.category) {
      const [cat] = await db.select().from(categories).where(eq(categories.slug, query.category)).limit(1);
      if (cat) conditions.push(eq(products.categoryId, cat.id));
      else conditions.push(sql`false`);
    }
    if (query.brand) conditions.push(ilike(products.brand, query.brand));
    if (query.color) conditions.push(ilike(products.color, query.color));
    if (query.storage) conditions.push(ilike(products.storage, query.storage));
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(
        or(ilike(products.brand, term), ilike(products.model, term), ilike(products.color, term))!
      );
    }

    const offset = (query.page - 1) * query.pageSize;

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(query.pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(and(...conditions)),
    ]);

    const imagesMap = await attachImages(rows.map((p) => p.id));
    const feesByMachine = await getAllFeesByMachine();

    const items = rows.map((p) => ({
      ...p,
      images: imagesMap.get(p.id) ?? [],
      pricing: pricingFor(p.price, feesByMachine.get(p.machineId) ?? []),
    }));

    res.json({ items, total: count, page: query.page, pageSize: query.pageSize });
  })
);

productsRouter.get(
  "/admin",
  requireAuth,
  requireRole("admin", "editor"),
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(products).orderBy(desc(products.createdAt));
    const imagesMap = await attachImages(rows.map((p) => p.id));
    res.json(rows.map((p) => ({ ...p, images: imagesMap.get(p.id) ?? [] })));
  })
);

productsRouter.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const [product] = await db.select().from(products).where(eq(products.slug, req.params.slug)).limit(1);
    if (!product) throw new HttpError(404, "Produto não encontrado");

    const imagesMap = await attachImages([product.id]);
    const fees = await getFeesForMachine(product.machineId);

    const related = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.categoryId, product.categoryId),
          ne(products.id, product.id),
          inArray(products.status, PUBLIC_PRODUCT_STATUSES)
        )
      )
      .limit(4);
    const relatedImagesMap = await attachImages(related.map((p) => p.id));
    const feesByMachine = await getAllFeesByMachine();

    res.json({
      ...product,
      images: imagesMap.get(product.id) ?? [],
      pricing: pricingFor(product.price, fees),
      related: related.map((p) => ({
        ...p,
        images: relatedImagesMap.get(p.id) ?? [],
        pricing: pricingFor(p.price, feesByMachine.get(p.machineId) ?? []),
      })),
    });
  })
);

productsRouter.post(
  "/",
  requireAuth,
  requireRole("admin", "editor"),
  asyncHandler(async (req, res) => {
    const data = productSchema.parse(req.body);
    const slug = await generateUniqueProductSlug(data);

    const [created] = await db
      .insert(products)
      .values({
        slug,
        brand: data.brand,
        model: data.model,
        color: data.color,
        storage: data.storage,
        categoryId: data.categoryId,
        price: data.price.toString(),
        pricePix: data.pricePix.toString(),
        description: data.description,
        specifications: data.specifications,
        status: data.status,
        machineId: data.machineId,
      })
      .returning();

    if (data.images.length > 0) {
      await db.insert(productImages).values(
        data.images.map((img) => ({
          productId: created.id,
          url: img.url,
          key: img.key,
          sortOrder: img.sortOrder,
          isMain: img.isMain,
        }))
      );
    }

    res.status(201).json(created);
  })
);

productsRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin", "editor"),
  asyncHandler(async (req, res) => {
    const data = productSchema.parse(req.body);
    const slug = await generateUniqueProductSlug(data, req.params.id);

    const [updated] = await db
      .update(products)
      .set({
        slug,
        brand: data.brand,
        model: data.model,
        color: data.color,
        storage: data.storage,
        categoryId: data.categoryId,
        price: data.price.toString(),
        pricePix: data.pricePix.toString(),
        description: data.description,
        specifications: data.specifications,
        status: data.status,
        machineId: data.machineId,
        updatedAt: new Date(),
      })
      .where(eq(products.id, req.params.id))
      .returning();

    if (!updated) throw new HttpError(404, "Produto não encontrado");

    await db.delete(productImages).where(eq(productImages.productId, updated.id));
    if (data.images.length > 0) {
      await db.insert(productImages).values(
        data.images.map((img) => ({
          productId: updated.id,
          url: img.url,
          key: img.key,
          sortOrder: img.sortOrder,
          isMain: img.isMain,
        }))
      );
    }

    res.json(updated);
  })
);

productsRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(products).where(eq(products.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Produto não encontrado");
    res.status(204).send();
  })
);

productsRouter.post(
  "/:id/duplicate",
  requireAuth,
  requireRole("admin", "editor"),
  asyncHandler(async (req, res) => {
    const [original] = await db.select().from(products).where(eq(products.id, req.params.id)).limit(1);
    if (!original) throw new HttpError(404, "Produto não encontrado");

    const originalImages = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, original.id))
      .orderBy(asc(productImages.sortOrder));

    const slug = await generateUniqueProductSlug(original);

    const [copy] = await db
      .insert(products)
      .values({
        slug,
        brand: original.brand,
        model: original.model,
        color: original.color,
        storage: original.storage,
        categoryId: original.categoryId,
        price: original.price,
        pricePix: original.pricePix,
        description: original.description,
        specifications: original.specifications,
        status: "em_breve",
        machineId: original.machineId,
      })
      .returning();

    if (originalImages.length > 0) {
      await db.insert(productImages).values(
        originalImages.map((img) => ({
          productId: copy.id,
          url: img.url,
          key: img.key,
          sortOrder: img.sortOrder,
          isMain: img.isMain,
        }))
      );
    }

    res.status(201).json(copy);
  })
);
