import { and, eq, gte, isNotNull, lte, ne, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { financialReserves, financialTransactions } from "../db/schema.js";

function n(value: unknown): number {
  return Number(value ?? 0);
}

/**
 * Saldo atual = tudo que já entrou (pago) menos tudo que já saiu (pago).
 * Transferências para reservas não entram aqui — elas só remarcam uma fatia
 * do saldo como "reservada" (ver getReserveBalances), o dinheiro continua seu.
 */
export async function getCashBalance(asOf?: Date): Promise<number> {
  const conditions = [ne(financialTransactions.type, "transferencia"), eq(financialTransactions.paid, true)];
  if (asOf) conditions.push(lte(financialTransactions.date, asOf));

  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(case when ${financialTransactions.type} = 'entrada' then ${financialTransactions.amount} else -${financialTransactions.amount} end), 0)`,
    })
    .from(financialTransactions)
    .where(and(...conditions));

  return n(row?.total);
}

export interface ReserveBalance {
  reserveId: string;
  currentAmount: number;
}

/** currentAmount de cada reserva = depósitos pagos - retiradas pagas. */
export async function getReserveBalances(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      reserveId: financialTransactions.reserveId,
      total: sql<string>`coalesce(sum(case when ${financialTransactions.reserveDirection} = 'deposito' then ${financialTransactions.amount} else -${financialTransactions.amount} end), 0)`,
    })
    .from(financialTransactions)
    .where(
      and(
        eq(financialTransactions.type, "transferencia"),
        eq(financialTransactions.paid, true),
        isNotNull(financialTransactions.reserveId)
      )
    )
    .groupBy(financialTransactions.reserveId);

  const map = new Map<string, number>();
  for (const row of rows) {
    if (row.reserveId) map.set(row.reserveId, n(row.total));
  }
  return map;
}

export async function getTotalReserved(): Promise<number> {
  const balances = await getReserveBalances();
  let total = 0;
  for (const value of balances.values()) total += value;
  return Math.round(total * 100) / 100;
}

export interface MonthTotals {
  entradas: number;
  entradasSemFinanciamento: number;
  saidas: number;
  saidasEmpresa: number;
  saidasPessoal: number;
  lucroLiquido: number;
}

export async function getMonthTotals(monthStart: Date, monthEnd: Date): Promise<MonthTotals> {
  const rows = await db
    .select({
      type: financialTransactions.type,
      scope: financialTransactions.scope,
      isFinancing: financialTransactions.isFinancing,
      amount: financialTransactions.amount,
    })
    .from(financialTransactions)
    .where(
      and(
        eq(financialTransactions.paid, true),
        ne(financialTransactions.type, "transferencia"),
        gte(financialTransactions.date, monthStart),
        lte(financialTransactions.date, monthEnd)
      )
    );

  let entradas = 0;
  let entradasSemFinanciamento = 0;
  let saidasEmpresa = 0;
  let saidasPessoal = 0;

  for (const row of rows) {
    const amount = n(row.amount);
    if (row.type === "entrada") {
      entradas += amount;
      if (!row.isFinancing) entradasSemFinanciamento += amount;
    } else if (row.type === "saida") {
      if (row.scope === "pessoal") saidasPessoal += amount;
      else saidasEmpresa += amount;
    }
  }

  const round = (v: number) => Math.round(v * 100) / 100;
  return {
    entradas: round(entradas),
    entradasSemFinanciamento: round(entradasSemFinanciamento),
    saidas: round(saidasEmpresa + saidasPessoal),
    saidasEmpresa: round(saidasEmpresa),
    saidasPessoal: round(saidasPessoal),
    lucroLiquido: round(entradasSemFinanciamento - saidasEmpresa),
  };
}

export interface PendingTotals {
  contasAPagar: number;
  contasAReceber: number;
  vencendoEm7Dias: number;
  vencendoEm30Dias: number;
}

export async function getPendingTotals(now: Date): Promise<PendingTotals> {
  const in7 = new Date(now);
  in7.setDate(in7.getDate() + 7);
  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);

  const rows = await db
    .select({
      type: financialTransactions.type,
      amount: financialTransactions.amount,
      dueDate: financialTransactions.dueDate,
    })
    .from(financialTransactions)
    .where(and(eq(financialTransactions.paid, false), isNotNull(financialTransactions.dueDate)));

  let contasAPagar = 0;
  let contasAReceber = 0;
  let vencendoEm7Dias = 0;
  let vencendoEm30Dias = 0;

  for (const row of rows) {
    const amount = n(row.amount);
    const due = row.dueDate ? new Date(row.dueDate) : null;
    if (row.type === "saida") {
      contasAPagar += amount;
      if (due && due <= in7) vencendoEm7Dias += amount;
      if (due && due <= in30) vencendoEm30Dias += amount;
    } else if (row.type === "entrada") {
      contasAReceber += amount;
    }
  }

  const round = (v: number) => Math.round(v * 100) / 100;
  return {
    contasAPagar: round(contasAPagar),
    contasAReceber: round(contasAReceber),
    vencendoEm7Dias: round(vencendoEm7Dias),
    vencendoEm30Dias: round(vencendoEm30Dias),
  };
}
