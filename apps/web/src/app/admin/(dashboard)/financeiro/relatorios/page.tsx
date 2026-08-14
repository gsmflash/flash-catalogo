"use client";

import { useEffect, useState } from "react";
import { Loader2, Target } from "lucide-react";
import { computeDailyGoal } from "@flashcell/shared";
import { adminFetch } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { todayInputValue } from "@/lib/date-utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FinancialMonthReport, FinancialMonthReportData } from "@/types";

const ROWS: Array<{ key: keyof FinancialMonthReportData; label: string }> = [
  { key: "entradas", label: "Total de entradas" },
  { key: "saidas", label: "Total de saídas" },
  { key: "lucroLiquido", label: "Lucro líquido" },
  { key: "gastosEmpresa", label: "Gastos da empresa" },
  { key: "gastosPessoal", label: "Gastos pessoais" },
  { key: "comprasEstoque", label: "Compras de estoque" },
  { key: "gastosAlimentacao", label: "Gastos com alimentação" },
  { key: "combustivel", label: "Combustível" },
  { key: "emprestimos", label: "Empréstimos (parcelas pagas)" },
  { key: "contasPagas", label: "Contas pagas" },
  { key: "contasPendentes", label: "Contas pendentes" },
  { key: "valoresAReceber", label: "Valores a receber" },
  { key: "valorInvestidoEmEstoque", label: "Valor investido em estoque" },
];

function diffLabel(current: number, previous: number) {
  if (previous === 0) return null;
  const diff = ((current - previous) / Math.abs(previous)) * 100;
  const sign = diff >= 0 ? "+" : "";
  return `${sign}${diff.toFixed(0)}%`;
}

export default function RelatoriosPage() {
  const [report, setReport] = useState<FinancialMonthReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch<FinancialMonthReport>("/financial/dashboard/report")
      .then(setReport)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Relatório Mensal</h1>
        <p className="text-sm text-muted-foreground">Mês atual comparado ao mês anterior.</p>
      </div>

      {loading || !report ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Indicador</th>
                <th className="px-4 py-3 text-right">Mês atual</th>
                <th className="px-4 py-3 text-right">Mês anterior</th>
                <th className="px-4 py-3 text-right">Variação</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => {
                const current = report.current[row.key];
                const previous = report.previous[row.key];
                const diff = diffLabel(current, previous);
                return (
                  <tr key={row.key} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatBRL(current)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(previous)}</td>
                    <td className={`px-4 py-3 text-right text-xs font-medium ${diff?.startsWith("+") ? "text-emerald-600" : diff ? "text-red-600" : "text-muted-foreground"}`}>
                      {diff ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <DailyGoalCalculator />
    </div>
  );
}

function DailyGoalCalculator() {
  const [targetAmount, setTargetAmount] = useState("");
  const [availableAmount, setAvailableAmount] = useState("");
  const [startDate, setStartDate] = useState(todayInputValue());
  const [endDate, setEndDate] = useState("");

  const target = Number(targetAmount.replace(",", "."));
  const available = Number(availableAmount.replace(",", ".")) || 0;
  const result =
    !Number.isNaN(target) && target > 0 && endDate
      ? computeDailyGoal(target, available, new Date(startDate), new Date(endDate))
      : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Target className="size-4 text-primary" />
        <CardTitle>Quanto preciso gerar por dia?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Valor que preciso juntar</Label>
            <Input inputMode="decimal" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="Ex: 5000" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Valor já disponível</Label>
            <Input inputMode="decimal" value={availableAmount} onChange={(e) => setAvailableAmount(e.target.value)} placeholder="Ex: 1000" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Data inicial</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Data final</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {result && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground">
              Faltam {formatBRL(result.missingAmount)} em {result.days} dia{result.days === 1 ? "" : "s"}
            </p>
            <p className="text-2xl font-extrabold text-primary">{formatBRL(result.dailyGoal)}/dia</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
