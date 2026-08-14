import { Router } from "express";
import { and, asc, desc, eq, gte, ilike, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { financialTransactionQuerySchema, financialTransactionSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { financialTransactions } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const financialTransactionsRouter = Router();
financialTransactionsRouter.use(requireAuth, requireRole("admin"));

function toInsertValues(data: ReturnType<typeof financialTransactionSchema.parse>) {
  return {
    type: data.type,
    scope: data.scope,
    description: data.description,
    amount: data.amount.toString(),
    grossAmount: data.grossAmount != null ? data.grossAmount.toString() : null,
    feePercent: data.feePercent != null ? data.feePercent.toString() : null,
    categoryId: data.categoryId ?? null,
    date: data.date,
    dueDate: data.dueDate ?? null,
    paid: data.paid,
    method: data.method ?? null,
    accountId: data.accountId ?? null,
    clientName: data.clientName ?? null,
    productId: data.productId ?? null,
    costAmount: data.costAmount != null ? data.costAmount.toString() : null,
    note: data.note ?? null,
    recurring: data.recurring,
    recurrenceDay: data.recurrenceDay ?? null,
    reserveId: data.reserveId ?? null,
    reserveDirection: data.reserveDirection ?? null,
  };
}

financialTransactionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = financialTransactionQuerySchema.parse(req.query);
    const conditions = [];

    if (query.type) conditions.push(eq(financialTransactions.type, query.type));
    if (query.scope) conditions.push(eq(financialTransactions.scope, query.scope));
    if (query.categoryId) conditions.push(eq(financialTransactions.categoryId, query.categoryId));
    if (query.paid !== undefined) conditions.push(eq(financialTransactions.paid, query.paid));
    if (query.method) conditions.push(eq(financialTransactions.method, query.method));
    if (query.accountId) conditions.push(eq(financialTransactions.accountId, query.accountId));
    if (query.loanId) conditions.push(eq(financialTransactions.loanId, query.loanId));
    if (query.reserveId) conditions.push(eq(financialTransactions.reserveId, query.reserveId));
    if (query.hasDueDate !== undefined) {
      conditions.push(query.hasDueDate ? isNotNull(financialTransactions.dueDate) : isNull(financialTransactions.dueDate));
    }
    if (query.dateFrom) conditions.push(gte(financialTransactions.date, query.dateFrom));
    if (query.dateTo) conditions.push(lte(financialTransactions.date, query.dateTo));
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(or(ilike(financialTransactions.description, term), ilike(financialTransactions.clientName, term))!);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (query.page - 1) * query.pageSize;
    const orderBy = query.paid === false ? [asc(financialTransactions.dueDate)] : [desc(financialTransactions.date)];

    const [rows, [{ count }]] = await Promise.all([
      db.query.financialTransactions.findMany({
        where,
        orderBy,
        limit: query.pageSize,
        offset,
        with: { category: true, account: true, product: { columns: { brand: true, model: true } } },
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(financialTransactions).where(where),
    ]);

    res.json({ items: rows, total: count, page: query.page, pageSize: query.pageSize });
  })
);

financialTransactionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = financialTransactionSchema.parse(req.body);
    const [created] = await db.insert(financialTransactions).values(toInsertValues(data)).returning();
    res.status(201).json(created);
  })
);

financialTransactionsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = financialTransactionSchema.parse(req.body);
    const [updated] = await db
      .update(financialTransactions)
      .set({ ...toInsertValues(data), updatedAt: new Date() })
      .where(eq(financialTransactions.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Lançamento não encontrado");
    res.json(updated);
  })
);

financialTransactionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(financialTransactions).where(eq(financialTransactions.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Lançamento não encontrado");
    res.status(204).send();
  })
);

/**
 * Marca como pago/recebido. Se for uma despesa recorrente, gera automaticamente
 * a próxima ocorrência (mesmo dia do mês seguinte) como pendente — assim uma
 * conta recorrente nunca precisa ser recadastrada manualmente todo mês.
 */
financialTransactionsRouter.patch(
  "/:id/pay",
  asyncHandler(async (req, res) => {
    const [current] = await db.select().from(financialTransactions).where(eq(financialTransactions.id, req.params.id)).limit(1);
    if (!current) throw new HttpError(404, "Lançamento não encontrado");

    // Idempotente: se já estava pago, não gera outra ocorrência recorrente
    // (protege contra duplo clique/retry criando duas parcelas do mês seguinte).
    if (current.paid) {
      res.json({ transaction: current, nextOccurrence: null });
      return;
    }

    const { updated, nextOccurrence } = await db.transaction(async (tx) => {
      const [updatedRow] = await tx
        .update(financialTransactions)
        .set({ paid: true, updatedAt: new Date() })
        .where(and(eq(financialTransactions.id, req.params.id), eq(financialTransactions.paid, false)))
        .returning();

      // Outra requisição já pagou entre o SELECT e aqui — nada mais a fazer.
      if (!updatedRow) return { updated: current, nextOccurrence: null };

      let nextOccurrenceRow = null;
      if (current.recurring && current.dueDate) {
        const nextDue = new Date(current.dueDate);
        nextDue.setMonth(nextDue.getMonth() + 1);
        if (current.recurrenceDay) nextDue.setDate(current.recurrenceDay);

        [nextOccurrenceRow] = await tx
          .insert(financialTransactions)
          .values({
            type: current.type,
            scope: current.scope,
            description: current.description,
            amount: current.amount,
            categoryId: current.categoryId,
            date: nextDue,
            dueDate: nextDue,
            paid: false,
            method: current.method,
            accountId: current.accountId,
            note: current.note,
            recurring: true,
            recurrenceDay: current.recurrenceDay,
          })
          .returning();
      }

      return { updated: updatedRow, nextOccurrence: nextOccurrenceRow };
    });

    res.json({ transaction: updated, nextOccurrence });
  })
);

/** Desmarca (volta para pendente) — útil se marcou como pago por engano. */
financialTransactionsRouter.patch(
  "/:id/unpay",
  asyncHandler(async (req, res) => {
    const [updated] = await db
      .update(financialTransactions)
      .set({ paid: false, updatedAt: new Date() })
      .where(eq(financialTransactions.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Lançamento não encontrado");
    res.json(updated);
  })
);
