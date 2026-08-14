import type { FinancialCategoryKind, LoanFrequency } from "./constants.js";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** Advances a date by one period of a loan's payment frequency. */
function nextInstallmentDate(date: Date, frequency: LoanFrequency): Date {
  switch (frequency) {
    case "diaria":
      return addDays(date, 1);
    case "diaria_seg_sab": {
      // Skip Sunday (getDay() === 0).
      const next = addDays(date, 1);
      return next.getDay() === 0 ? addDays(next, 1) : next;
    }
    case "semanal":
      return addDays(date, 7);
    case "quinzenal":
      return addDays(date, 14);
    case "mensal":
      return addMonths(date, 1);
  }
}

/**
 * Generates the due dates for a loan's installments given the first due date
 * and payment frequency. The number of installments is derived from
 * totalToPay / installmentAmount (ceil), with the last installment absorbing
 * any rounding remainder — matches how informal loans are usually agreed
 * (fixed daily/weekly payment until the total is settled).
 */
export function generateLoanInstallments(
  totalToPay: number,
  installmentAmount: number,
  firstDueDate: Date,
  frequency: LoanFrequency
): Array<{ installmentNumber: number; amount: number; dueDate: Date }> {
  const count = Math.max(1, Math.ceil(totalToPay / installmentAmount));
  const installments: Array<{ installmentNumber: number; amount: number; dueDate: Date }> = [];
  let dueDate = firstDueDate;
  let remaining = totalToPay;

  for (let i = 1; i <= count; i++) {
    const amount = i === count ? round2(remaining) : installmentAmount;
    installments.push({ installmentNumber: i, amount, dueDate });
    remaining = round2(remaining - amount);
    if (i < count) dueDate = nextInstallmentDate(dueDate, frequency);
  }

  return installments;
}

export interface LoanSummary {
  totalPaid: number;
  totalRemaining: number;
  installmentsPaid: number;
  installmentsRemaining: number;
  nextDueDate: Date | null;
}

export function summarizeLoan(
  installments: Array<{ amount: number | string; paid: boolean; dueDate: Date | string | null }>
): LoanSummary {
  let totalPaid = 0;
  let totalRemaining = 0;
  let installmentsPaid = 0;
  let nextDueDate: Date | null = null;

  for (const inst of installments) {
    const amount = Number(inst.amount);
    if (inst.paid) {
      totalPaid = round2(totalPaid + amount);
      installmentsPaid += 1;
    } else {
      totalRemaining = round2(totalRemaining + amount);
      const due = inst.dueDate ? new Date(inst.dueDate) : null;
      if (due && (!nextDueDate || due < nextDueDate)) nextDueDate = due;
    }
  }

  return {
    totalPaid,
    totalRemaining,
    installmentsPaid,
    installmentsRemaining: installments.length - installmentsPaid,
    nextDueDate,
  };
}

export type BudgetStatus = "ok" | "warning" | "critical";

export interface BudgetUsage {
  percent: number;
  status: BudgetStatus;
  remaining: number;
}

/** 80% = alerta, 100%+ = crítico, per the module spec. */
export function computeBudgetUsage(limitAmount: number, spentAmount: number): BudgetUsage {
  const percent = limitAmount > 0 ? round2((spentAmount / limitAmount) * 100) : 0;
  const status: BudgetStatus = percent >= 100 ? "critical" : percent >= 80 ? "warning" : "ok";
  return { percent, status, remaining: round2(limitAmount - spentAmount) };
}

export interface ReserveProgress {
  percent: number;
  remaining: number;
}

export function computeReserveProgress(goalAmount: number, currentAmount: number): ReserveProgress {
  const percent = goalAmount > 0 ? round2(Math.min(100, (currentAmount / goalAmount) * 100)) : 0;
  return { percent, remaining: round2(Math.max(0, goalAmount - currentAmount)) };
}

/**
 * "Quanto preciso gerar por dia?" — given a target amount, what's already
 * available, and a date range, computes the daily amount still needed.
 */
export function computeDailyGoal(
  targetAmount: number,
  availableAmount: number,
  startDate: Date,
  endDate: Date
): { missingAmount: number; days: number; dailyGoal: number } {
  const missingAmount = Math.max(0, round2(targetAmount - availableAmount));
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay));
  return { missingAmount, days, dailyGoal: round2(missingAmount / days) };
}

/**
 * Lightweight "lançamento rápido" parser: pulls the trailing number out of a
 * free-text entry ("Gasolina 100" -> {description: "Gasolina", amount: 100})
 * and guesses the category by keyword match against the available list, so
 * mobile quick-entry needs the fewest possible taps.
 */
export function parseQuickEntry(
  text: string,
  categories: Array<{ id: string; name: string; kind: FinancialCategoryKind }>,
  kind: FinancialCategoryKind
): { description: string; amount: number | null; categoryId: string | null } {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.*?)\s*[-–—]?\s*R?\$?\s*(\d+(?:[.,]\d{1,2})?)\s*$/);
  const description = (match ? match[1] : trimmed).trim();
  const amount = match ? Number(match[2].replace(",", ".")) : null;

  const pool = categories.filter((c) => c.kind === kind);
  const normalizedDesc = description.toLowerCase();
  const KEYWORDS: Record<string, string[]> = {
    alimentação: ["almoço", "janta", "café", "lanche", "restaurante", "ifood", "comida", "mercado"],
    "combustível pessoal": ["gasolina", "combustivel", "combustível", "álcool", "etanol", "posto"],
    combustível: ["gasolina", "combustivel", "combustível", "álcool", "etanol", "posto"],
    lazer: ["cinema", "bar", "festa", "show", "viagem", "passeio"],
    casa: ["luz", "água", "agua", "condominio", "condomínio", "gás", "gas"],
  };

  let categoryId: string | null = null;
  for (const cat of pool) {
    const keywords = KEYWORDS[cat.name.toLowerCase()];
    if (keywords?.some((k) => normalizedDesc.includes(k))) {
      categoryId = cat.id;
      break;
    }
  }
  if (!categoryId) {
    categoryId = pool.find((c) => c.name === "Outros")?.id ?? pool[0]?.id ?? null;
  }

  return { description: description || trimmed, amount, categoryId };
}
