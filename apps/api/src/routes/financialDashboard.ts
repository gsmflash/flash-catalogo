import { Router } from "express";
import { and, asc, eq, gte, isNotNull, lte } from "drizzle-orm";
import { formatBRLServer } from "../lib/format.js";
import { db } from "../db/client.js";
import { financialReserves, financialTransactions } from "../db/schema.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getCashBalance, getMonthTotals, getPendingTotals, getReserveBalances, getTotalReserved } from "../lib/financialCalc.js";

export const financialDashboardRouter = Router();
financialDashboardRouter.use(requireAuth, requireRole("admin"));

function n(v: unknown): number {
  return Number(v ?? 0);
}
function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

financialDashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [saldoAtual, monthTotals, pending, valorReservado] = await Promise.all([
      getCashBalance(),
      getMonthTotals(monthStart, monthEnd),
      getPendingTotals(now),
      getTotalReserved(),
    ]);

    // Pendências do mês (ainda não realizadas) para o "resultado projetado do mês".
    const pendingThisMonth = await db
      .select({
        type: financialTransactions.type,
        scope: financialTransactions.scope,
        isFinancing: financialTransactions.isFinancing,
        amount: financialTransactions.amount,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.paid, false),
          gte(financialTransactions.date, monthStart),
          lte(financialTransactions.date, monthEnd)
        )
      );

    let pendingEntradas = 0;
    let pendingSaidasEmpresa = 0;
    for (const row of pendingThisMonth) {
      const amount = n(row.amount);
      if (row.type === "entrada" && !row.isFinancing) pendingEntradas += amount;
      else if (row.type === "saida" && row.scope !== "pessoal") pendingSaidasEmpresa += amount;
    }
    const resultadoProjetadoMes = round2(monthTotals.lucroLiquido + pendingEntradas - pendingSaidasEmpresa);

    // Próximos vencimentos (pendentes, ordenados por data), com status calculado.
    const upcomingRows = await db.query.financialTransactions.findMany({
      where: and(eq(financialTransactions.paid, false), isNotNull(financialTransactions.dueDate)),
      orderBy: asc(financialTransactions.dueDate),
      limit: 15,
      with: { category: true },
    });

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const upcoming = upcomingRows.map((row) => {
      const due = row.dueDate ? new Date(row.dueDate) : null;
      let status: "vencido" | "vencendo_hoje" | "pendente" = "pendente";
      if (due) {
        if (due < startOfToday) status = "vencido";
        else if (due <= endOfToday) status = "vencendo_hoje";
      }
      return { ...row, status };
    });

    // Gráfico: entradas x saídas por dia no mês atual.
    const dailyRows = await db
      .select({
        type: financialTransactions.type,
        date: financialTransactions.date,
        amount: financialTransactions.amount,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.paid, true),
          gte(financialTransactions.date, monthStart),
          lte(financialTransactions.date, monthEnd)
        )
      );

    const dayMap = new Map<string, { entradas: number; saidas: number }>();
    for (const row of dailyRows) {
      if (row.type === "transferencia") continue;
      const key = new Date(row.date).toISOString().slice(0, 10);
      const bucket = dayMap.get(key) ?? { entradas: 0, saidas: 0 };
      if (row.type === "entrada") bucket.entradas = round2(bucket.entradas + n(row.amount));
      else bucket.saidas = round2(bucket.saidas + n(row.amount));
      dayMap.set(key, bucket);
    }
    const chart = Array.from(dayMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Mensagens automáticas.
    const insights: string[] = [];
    if (pending.vencendoEm7Dias > 0) {
      insights.push(`Você possui ${formatBRLServer(pending.vencendoEm7Dias)} em contas vencendo nos próximos 7 dias.`);
    }
    if (upcoming.some((u) => u.status === "vencido")) {
      const vencidoTotal = round2(upcoming.filter((u) => u.status === "vencido" && u.type === "saida").reduce((s, u) => s + n(u.amount), 0));
      if (vencidoTotal > 0) insights.push(`Você tem ${formatBRLServer(vencidoTotal)} em contas vencidas.`);
    }
    if (monthTotals.saidasPessoal > 0 && monthTotals.saidasEmpresa > 0 && monthTotals.saidasPessoal > monthTotals.saidasEmpresa * 0.5) {
      insights.push(`Seus gastos pessoais já representam uma fatia grande das suas saídas este mês.`);
    }

    const reserveBalances = await getReserveBalances();
    const reserves = await db.select().from(financialReserves);
    for (const reserve of reserves) {
      const current = reserveBalances.get(reserve.id) ?? 0;
      const goal = n(reserve.goalAmount);
      if (goal > 0 && current > 0 && current < goal) {
        const percent = Math.round((current / goal) * 100);
        if (percent >= 50) insights.push(`Você já reservou ${percent}% do valor necessário para "${reserve.name}".`);
      }
    }

    res.json({
      saldoAtual: round2(saldoAtual),
      entradasMes: monthTotals.entradas,
      saidasMes: monthTotals.saidas,
      lucroLiquidoMes: monthTotals.lucroLiquido,
      contasAPagar: pending.contasAPagar,
      contasAReceber: pending.contasAReceber,
      valorReservado,
      resultadoProjetadoMes,
      upcoming,
      chart,
      insights,
    });
  })
);

const HORIZON_DAYS: Record<string, number | "mes_atual" | "mes_seguinte"> = {
  hoje: 0,
  "7d": 7,
  "15d": 15,
  "30d": 30,
  mes_atual: "mes_atual",
  mes_seguinte: "mes_seguinte",
};

financialDashboardRouter.get(
  "/projection",
  asyncHandler(async (req, res) => {
    const horizon = typeof req.query.horizon === "string" ? req.query.horizon : "30d";
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let rangeEnd: Date;
    if (horizon === "mes_atual") {
      rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (horizon === "mes_seguinte") {
      rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
    } else {
      const days = typeof HORIZON_DAYS[horizon] === "number" ? (HORIZON_DAYS[horizon] as number) : 30;
      rangeEnd = new Date(startOfToday);
      rangeEnd.setDate(rangeEnd.getDate() + days);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    const saldoAtual = round2(await getCashBalance());

    const pendingRows = await db
      .select({
        type: financialTransactions.type,
        description: financialTransactions.description,
        amount: financialTransactions.amount,
        dueDate: financialTransactions.dueDate,
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.paid, false),
          isNotNull(financialTransactions.dueDate),
          lte(financialTransactions.dueDate, rangeEnd)
        )
      )
      .orderBy(asc(financialTransactions.dueDate));

    const dayMap = new Map<string, { entradas: number; saidas: number; items: Array<{ description: string; amount: number; type: string }> }>();
    for (const row of pendingRows) {
      if (!row.dueDate) continue;
      const key = new Date(row.dueDate).toISOString().slice(0, 10);
      const bucket = dayMap.get(key) ?? { entradas: 0, saidas: 0, items: [] };
      const amount = n(row.amount);
      if (row.type === "entrada") bucket.entradas = round2(bucket.entradas + amount);
      else bucket.saidas = round2(bucket.saidas + amount);
      bucket.items.push({ description: row.description, amount, type: row.type });
      dayMap.set(key, bucket);
    }

    const days = Array.from(dayMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let running = saldoAtual;
    let willGoNegative = false;
    let negativeDate: string | null = null;
    const withRunningBalance = days.map((d) => {
      running = round2(running + d.entradas - d.saidas);
      if (running < 0 && !willGoNegative) {
        willGoNegative = true;
        negativeDate = d.date;
      }
      return { ...d, saldoAcumulado: running };
    });

    const totalEntradas = round2(days.reduce((s, d) => s + d.entradas, 0));
    const totalSaidas = round2(days.reduce((s, d) => s + d.saidas, 0));

    res.json({
      saldoAtual,
      saldoProjetado: round2(saldoAtual + totalEntradas - totalSaidas),
      totalEntradasPrevistas: totalEntradas,
      totalSaidasPrevistas: totalSaidas,
      willGoNegative,
      negativeDate,
      days: withRunningBalance,
    });
  })
);

const STOCK_CATEGORIES = ["Compra de aparelhos", "Compra de acessórios"];
const FOOD_CATEGORIES = ["Alimentação"];
const FUEL_CATEGORIES = ["Combustível", "Combustível pessoal"];

async function buildMonthlyReport(monthStart: Date, monthEnd: Date) {
  const [monthTotals, pending] = await Promise.all([getMonthTotals(monthStart, monthEnd), getPendingTotals(new Date())]);

  const rows = await db.query.financialTransactions.findMany({
    where: and(gte(financialTransactions.date, monthStart), lte(financialTransactions.date, monthEnd)),
    with: { category: true },
  });

  let comprasEstoque = 0;
  let gastosAlimentacao = 0;
  let combustivel = 0;
  let emprestimos = 0;
  let contasPagas = 0;

  for (const row of rows) {
    if (row.type !== "saida" || !row.paid) continue;
    const amount = n(row.amount);
    const categoryName = row.category?.name ?? "";
    if (STOCK_CATEGORIES.includes(categoryName)) comprasEstoque += amount;
    if (FOOD_CATEGORIES.includes(categoryName)) gastosAlimentacao += amount;
    if (FUEL_CATEGORIES.includes(categoryName)) combustivel += amount;
    if (row.loanId) emprestimos += amount;
    if (row.dueDate) contasPagas += amount;
  }

  return {
    entradas: monthTotals.entradas,
    saidas: monthTotals.saidas,
    lucroLiquido: monthTotals.lucroLiquido,
    gastosEmpresa: monthTotals.saidasEmpresa,
    gastosPessoal: monthTotals.saidasPessoal,
    comprasEstoque: round2(comprasEstoque),
    gastosAlimentacao: round2(gastosAlimentacao),
    combustivel: round2(combustivel),
    emprestimos: round2(emprestimos),
    contasPagas: round2(contasPagas),
    contasPendentes: pending.contasAPagar,
    valoresAReceber: pending.contasAReceber,
    valorInvestidoEmEstoque: round2(comprasEstoque),
  };
}

financialDashboardRouter.get(
  "/report",
  asyncHandler(async (req, res) => {
    const monthParam = typeof req.query.month === "string" ? req.query.month : null;
    const now = new Date();
    const [year, month] = monthParam ? monthParam.split("-").map(Number) : [now.getFullYear(), now.getMonth() + 1];

    const currentStart = new Date(year, month - 1, 1);
    const currentEnd = new Date(year, month, 0, 23, 59, 59, 999);
    const previousStart = new Date(year, month - 2, 1);
    const previousEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);

    const [current, previous] = await Promise.all([
      buildMonthlyReport(currentStart, currentEnd),
      buildMonthlyReport(previousStart, previousEnd),
    ]);

    res.json({ month: `${year}-${String(month).padStart(2, "0")}`, current, previous });
  })
);
