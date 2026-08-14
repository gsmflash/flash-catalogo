import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { financialAccountSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { financialAccounts } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const financialAccountsRouter = Router();
financialAccountsRouter.use(requireAuth, requireRole("admin"));

financialAccountsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(financialAccounts).orderBy(asc(financialAccounts.name));
    res.json(rows);
  })
);

financialAccountsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = financialAccountSchema.parse(req.body);
    const [created] = await db.insert(financialAccounts).values(data).returning();
    res.status(201).json(created);
  })
);

financialAccountsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = financialAccountSchema.partial().parse(req.body);
    const [updated] = await db
      .update(financialAccounts)
      .set(data)
      .where(eq(financialAccounts.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Conta não encontrada");
    res.json(updated);
  })
);

financialAccountsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(financialAccounts).where(eq(financialAccounts.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Conta não encontrada");
    res.status(204).send();
  })
);
