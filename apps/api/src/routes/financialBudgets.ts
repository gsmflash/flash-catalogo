import { Router } from "express";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { financialBudgetSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { financialBudgets, financialCategories, financialTransactions } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const financialBudgetsRouter = Router();
financialBudgetsRouter.use(requireAuth, requireRole("admin"));

financialBudgetsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgets = await db
      .select({
        id: financialBudgets.id,
        categoryId: financialBudgets.categoryId,
        limitAmount: financialBudgets.limitAmount,
        categoryName: financialCategories.name,
        categoryKind: financialCategories.kind,
      })
      .from(financialBudgets)
      .innerJoin(financialCategories, eq(financialBudgets.categoryId, financialCategories.id));

    const spentRows = await db
      .select({
        categoryId: financialTransactions.categoryId,
        total: sql<string>`coalesce(sum(${financialTransactions.amount}), 0)`,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, "saida"),
          eq(financialTransactions.paid, true),
          gte(financialTransactions.date, monthStart),
          lte(financialTransactions.date, monthEnd)
        )
      )
      .groupBy(financialTransactions.categoryId);

    const spentMap = new Map(spentRows.map((r) => [r.categoryId, Number(r.total)]));

    res.json(
      budgets.map((b) => ({
        ...b,
        spentAmount: Math.round((spentMap.get(b.categoryId) ?? 0) * 100) / 100,
      }))
    );
  })
);

financialBudgetsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = financialBudgetSchema.parse(req.body);
    const [created] = await db
      .insert(financialBudgets)
      .values({ categoryId: data.categoryId, limitAmount: data.limitAmount.toString() })
      .onConflictDoUpdate({
        target: financialBudgets.categoryId,
        set: { limitAmount: data.limitAmount.toString(), updatedAt: new Date() },
      })
      .returning();
    res.status(201).json(created);
  })
);

financialBudgetsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = financialBudgetSchema.partial().parse(req.body);
    const [updated] = await db
      .update(financialBudgets)
      .set({ ...(data.limitAmount !== undefined ? { limitAmount: data.limitAmount.toString() } : {}), updatedAt: new Date() })
      .where(eq(financialBudgets.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Orçamento não encontrado");
    res.json(updated);
  })
);

financialBudgetsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(financialBudgets).where(eq(financialBudgets.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Orçamento não encontrado");
    res.status(204).send();
  })
);
