import { Router } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { financialLoanSchema, generateLoanInstallments, summarizeLoan } from "@flashcell/shared";
import { db } from "../db/client.js";
import { financialCategories, financialLoans, financialTransactions } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const financialLoansRouter = Router();
financialLoansRouter.use(requireAuth, requireRole("admin"));

async function loanCategoryId(scope: "empresa" | "pessoal") {
  const kind = scope === "pessoal" ? "saida_pessoal" : "saida_empresa";
  const [category] = await db
    .select()
    .from(financialCategories)
    .where(eq(financialCategories.kind, kind))
    .orderBy(asc(financialCategories.sortOrder));
  const [emprestimo] = await db
    .select()
    .from(financialCategories)
    .where(eq(financialCategories.name, "Empréstimo"));
  return emprestimo?.id ?? category?.id ?? null;
}

async function entradaFinanciamentoCategoryId() {
  const [category] = await db
    .select()
    .from(financialCategories)
    .where(eq(financialCategories.name, "Empréstimo/Financiamento"));
  return category?.id ?? null;
}

financialLoansRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const loans = await db.select().from(financialLoans).orderBy(desc(financialLoans.receivedDate));
    const installments = await db.select().from(financialTransactions).where(eq(financialTransactions.type, "saida"));

    const byLoan = new Map<string, typeof installments>();
    for (const inst of installments) {
      if (!inst.loanId) continue;
      const list = byLoan.get(inst.loanId) ?? [];
      list.push(inst);
      byLoan.set(inst.loanId, list);
    }

    res.json(
      loans.map((loan) => {
        const loanInstallments = byLoan.get(loan.id) ?? [];
        const summary = summarizeLoan(loanInstallments.map((i) => ({ amount: i.amount, paid: i.paid, dueDate: i.dueDate })));
        return { ...loan, installmentsCount: loanInstallments.length, ...summary };
      })
    );
  })
);

financialLoansRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [loan] = await db.select().from(financialLoans).where(eq(financialLoans.id, req.params.id)).limit(1);
    if (!loan) throw new HttpError(404, "Empréstimo não encontrado");

    const installments = await db
      .select()
      .from(financialTransactions)
      .where(eq(financialTransactions.loanId, req.params.id))
      .orderBy(asc(financialTransactions.installmentNumber));

    const summary = summarizeLoan(installments.map((i) => ({ amount: i.amount, paid: i.paid, dueDate: i.dueDate })));
    res.json({ ...loan, installments, ...summary });
  })
);

/**
 * Cria o empréstimo + 1 entrada de financiamento (não conta como lucro) +
 * N parcelas de saída pré-geradas (uma linha em financial_transactions por
 * parcela, ligadas por loanId — sem tabela separada de parcelas).
 */
financialLoansRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = financialLoanSchema.parse(req.body);

    const [loan] = await db
      .insert(financialLoans)
      .values({
        description: data.description,
        principalAmount: data.principalAmount.toString(),
        receivedDate: data.receivedDate,
        installmentsCount: 0,
        installmentAmount: data.installmentAmount.toString(),
        frequency: data.frequency,
        firstDueDate: data.firstDueDate,
        totalToPay: data.totalToPay.toString(),
        interestAmount: data.interestAmount != null ? data.interestAmount.toString() : null,
        status: data.status,
        accountId: data.accountId ?? null,
      })
      .returning();

    const entradaCategoryId = await entradaFinanciamentoCategoryId();
    await db.insert(financialTransactions).values({
      type: "entrada",
      scope: data.scope,
      description: `Empréstimo recebido: ${data.description}`,
      amount: data.principalAmount.toString(),
      categoryId: entradaCategoryId,
      date: data.receivedDate,
      paid: true,
      accountId: data.accountId ?? null,
      isFinancing: true,
      loanId: loan.id,
    });

    const installmentCategoryId = await loanCategoryId(data.scope);
    const installments = generateLoanInstallments(data.totalToPay, data.installmentAmount, data.firstDueDate, data.frequency);

    if (installments.length > 0) {
      await db.insert(financialTransactions).values(
        installments.map((inst) => ({
          type: "saida" as const,
          scope: data.scope,
          description: `${data.description} — parcela ${inst.installmentNumber}/${installments.length}`,
          amount: inst.amount.toString(),
          categoryId: installmentCategoryId,
          date: inst.dueDate,
          dueDate: inst.dueDate,
          paid: false,
          loanId: loan.id,
          installmentNumber: inst.installmentNumber,
        }))
      );
    }

    const [updatedLoan] = await db
      .update(financialLoans)
      .set({ installmentsCount: installments.length })
      .where(eq(financialLoans.id, loan.id))
      .returning();

    res.status(201).json(updatedLoan);
  })
);

financialLoansRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = financialLoanSchema.partial().pick({ status: true, description: true }).parse(req.body);
    const [updated] = await db.update(financialLoans).set(data).where(eq(financialLoans.id, req.params.id)).returning();
    if (!updated) throw new HttpError(404, "Empréstimo não encontrado");
    res.json(updated);
  })
);
