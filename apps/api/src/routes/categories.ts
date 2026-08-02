import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { categorySchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { categories } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const categoriesRouter = Router();

categoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const all = await db.select().from(categories).orderBy(asc(categories.sortOrder));
    res.json(all);
  })
);

categoriesRouter.post(
  "/",
  requireAuth,
  requireRole("admin", "editor"),
  asyncHandler(async (req, res) => {
    const data = categorySchema.parse(req.body);
    const [created] = await db.insert(categories).values(data).returning();
    res.status(201).json(created);
  })
);

categoriesRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin", "editor"),
  asyncHandler(async (req, res) => {
    const data = categorySchema.partial().parse(req.body);
    const [updated] = await db
      .update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Categoria não encontrada");
    res.json(updated);
  })
);

categoriesRouter.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(categories).where(eq(categories.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Categoria não encontrada");
    res.status(204).send();
  })
);
