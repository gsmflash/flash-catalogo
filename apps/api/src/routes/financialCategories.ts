import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { financialCategorySchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { financialCategories } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const financialCategoriesRouter = Router();
financialCategoriesRouter.use(requireAuth, requireRole("admin"));

financialCategoriesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select()
      .from(financialCategories)
      .orderBy(asc(financialCategories.kind), asc(financialCategories.sortOrder));
    res.json(rows);
  })
);

financialCategoriesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = financialCategorySchema.parse(req.body);
    const [created] = await db.insert(financialCategories).values(data).returning();
    res.status(201).json(created);
  })
);

financialCategoriesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = financialCategorySchema.partial().parse(req.body);
    const [updated] = await db
      .update(financialCategories)
      .set(data)
      .where(eq(financialCategories.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Categoria não encontrada");
    res.json(updated);
  })
);

financialCategoriesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(financialCategories).where(eq(financialCategories.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Categoria não encontrada");
    res.status(204).send();
  })
);
