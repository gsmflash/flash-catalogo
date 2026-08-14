"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Receipt,
  HandCoins,
  PiggyBank,
  Target,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryCard } from "@/components/financeiro/summary-card";
import { TransactionStatusBadge, statusFor } from "@/components/financeiro/status-badge";
import { TransactionFormDialog } from "@/components/financeiro/transaction-form-dialog";
import type { FinancialAccount, FinancialCategory, FinancialDashboardSummary } from "@/types";

export default function FinanceiroDashboardPage() {
  const [summary, setSummary] = useState<FinancialDashboardSummary | null>(null);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  function reload() {
    adminFetch<FinancialDashboardSummary>("/financial/dashboard/summary").then(setSummary);
  }

  useEffect(() => {
    reload();
    adminFetch<FinancialCategory[]>("/financial/categories").then(setCategories);
    adminFetch<FinancialAccount[]>("/financial/accounts").then(setAccounts).finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxChartValue = Math.max(1, ...summary.chart.flatMap((d) => [d.entradas, d.saidas]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Visão geral do caixa, contas e resultado da Flash Cell.</p>
        </div>
        <div className="flex gap-2">
          <TransactionFormDialog type="entrada" categories={categories} accounts={accounts} onSaved={reload} />
          <TransactionFormDialog type="saida" categories={categories} accounts={accounts} onSaved={reload} />
        </div>
      </div>

      {summary.insights.length > 0 && (
        <div className="flex flex-col gap-2">
          {summary.insights.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <SummaryCard label="Saldo atual" value={summary.saldoAtual} icon={Wallet} tone={summary.saldoAtual >= 0 ? "positive" : "negative"} />
        <SummaryCard label="Entradas do mês" value={summary.entradasMes} icon={ArrowDownCircle} tone="positive" />
        <SummaryCard label="Saídas do mês" value={summary.saidasMes} icon={ArrowUpCircle} tone="negative" />
        <SummaryCard
          label="Lucro líquido do mês"
          value={summary.lucroLiquidoMes}
          icon={TrendingUp}
          tone={summary.lucroLiquidoMes >= 0 ? "positive" : "negative"}
        />
        <SummaryCard label="Contas a pagar" value={summary.contasAPagar} icon={Receipt} tone="warning" />
        <SummaryCard label="Contas a receber" value={summary.contasAReceber} icon={HandCoins} tone="default" />
        <SummaryCard label="Valor reservado" value={summary.valorReservado} icon={PiggyBank} tone="default" />
        <SummaryCard
          label="Resultado projetado do mês"
          value={summary.resultadoProjetadoMes}
          icon={Target}
          tone={summary.resultadoProjetadoMes >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo de caixa — {new Date().toLocaleDateString("pt-BR", { month: "long" })}</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.chart.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma movimentação este mês ainda.</p>
            ) : (
              <div className="flex h-48 items-end gap-1.5 overflow-x-auto pb-1">
                {summary.chart.map((d) => (
                  <div key={d.date} className="flex min-w-[18px] flex-1 flex-col items-center gap-1" title={`${d.date}`}>
                    <div className="flex h-36 w-full items-end gap-0.5">
                      <div
                        className="flex-1 rounded-t bg-emerald-500/70"
                        style={{ height: `${(d.entradas / maxChartValue) * 100}%` }}
                        title={`Entradas: ${formatBRL(d.entradas)}`}
                      />
                      <div
                        className="flex-1 rounded-t bg-red-500/70"
                        style={{ height: `${(d.saidas / maxChartValue) * 100}%` }}
                        title={`Saídas: ${formatBRL(d.saidas)}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(d.date).getDate()}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500/70" /> Entradas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-red-500/70" /> Saídas
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximos vencimentos</CardTitle>
            <Link href="/admin/financeiro/contas-a-pagar" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Ver tudo <ArrowRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {summary.upcoming.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum vencimento pendente.</p>
            ) : (
              summary.upcoming.map((item) => {
                const status = item.status ?? statusFor(item.paid, item.dueDate);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.description}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.category?.name ?? "—"} · {item.dueDate && new Date(item.dueDate).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`text-sm font-semibold ${item.type === "entrada" ? "text-emerald-600" : "text-red-600"}`}>
                        {formatBRL(item.amount)}
                      </span>
                      <TransactionStatusBadge status={status} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
