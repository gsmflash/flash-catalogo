import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { computeReserveProgress, financialReserveSchema, financialReserveTransferSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { financialReserves, financialTransactions } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getReserveBalances } from "../lib/financialCalc.js";

export const financialReservesRouter = Router();
financialReservesRouter.use(requireAuth, requireRole("admin"));

financialReservesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [rows, balances] = await Promise.all([
      db.select().from(financialReserves).orderBy(asc(financialReserves.name)),
      getReserveBalances(),
    ]);

    res.json(
      rows.map((r) => {
        const currentAmount = balances.get(r.id) ?? 0;
        const progress = computeReserveProgress(Number(r.goalAmount), currentAmount);
        return { ...r, currentAmount, ...progress };
      })
    );
  })
);

financialReservesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = financialReserveSchema.parse(req.body);
    const [created] = await db
      .insert(financialReserves)
      .values({ name: data.name, goalAmount: data.goalAmount.toString(), deadline: data.deadline ?? null, note: data.note ?? null })
      .returning();
    res.status(201).json(created);
  })
);

financialReservesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = financialReserveSchema.partial().parse(req.body);
    const [updated] = await db
      .update(financialReserves)
      .set({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.goalAmount !== undefined ? { goalAmount: data.goalAmount.toString() } : {}),
        ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
      })
      .where(eq(financialReserves.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Reserva não encontrada");
    res.json(updated);
  })
);

financialReservesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(financialReserves).where(eq(financialReserves.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Reserva não encontrada");
    res.status(204).send();
  })
);

/**
 * Transferir do saldo pra uma reserva (ou de volta). Isso é sempre registrado
 * como uma transação type="transferencia" — nunca conta como receita/despesa,
 * só remarca uma fatia do caixa como "reservada".
 */
financialReservesRouter.post(
  "/:id/transfer",
  asyncHandler(async (req, res) => {
    const data = financialReserveTransferSchema.parse({ ...req.body, reserveId: req.params.id });
    const [reserve] = await db.select().from(financialReserves).where(eq(financialReserves.id, data.reserveId)).limit(1);
    if (!reserve) throw new HttpError(404, "Reserva não encontrada");

    const [created] = await db
      .insert(financialTransactions)
      .values({
        type: "transferencia",
        scope: "empresa",
        description: `${data.direction === "deposito" ? "Transferência para" : "Retirada de"} reserva: ${reserve.name}`,
        amount: data.amount.toString(),
        categoryId: req.body.categoryId ?? null,
        date: data.date,
        paid: true,
        accountId: data.accountId ?? null,
        note: data.note ?? null,
        reserveId: data.reserveId,
        reserveDirection: data.direction,
      } as typeof financialTransactions.$inferInsert)
      .returning();

    res.status(201).json(created);
  })
);
