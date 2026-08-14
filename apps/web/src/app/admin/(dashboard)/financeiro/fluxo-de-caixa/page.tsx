"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { adminFetch } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import type { FinancialProjection } from "@/types";

const HORIZONS = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "15d", label: "15 dias" },
  { value: "30d", label: "30 dias" },
  { value: "mes_atual", label: "Mês atual" },
  { value: "mes_seguinte", label: "Mês seguinte" },
];

export default function FluxoDeCaixaPage() {
  const [horizon, setHorizon] = useState("30d");
  const [data, setData] = useState<FinancialProjection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminFetch<FinancialProjection>(`/financial/dashboard/projection?horizon=${horizon}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [horizon]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Fluxo de Caixa Projetado</h1>
        <p className="text-sm text-muted-foreground">Saldo atual + entradas previstas − despesas previstas.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {HORIZONS.map((h) => (
          <button
            key={h.value}
            onClick={() => setHorizon(h.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              horizon === h.value ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {h.label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {data.willGoNegative && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Seu caixa projetado ficará <strong>negativo</strong> em{" "}
                {data.negativeDate && new Date(data.negativeDate).toLocaleDateString("pt-BR")} se nenhuma nova entrada ocorrer.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Wallet className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Saldo atual</p>
                  <p className="text-lg font-bold">{formatBRL(data.saldoAtual)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <TrendingUp className="size-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Entradas previstas</p>
                  <p className="text-lg font-bold text-emerald-600">{formatBRL(data.totalEntradasPrevistas)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <TrendingDown className="size-5 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Despesas previstas</p>
                  <p className="text-lg font-bold text-red-600">{formatBRL(data.totalSaidasPrevistas)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Saldo projetado</p>
                <p className={`text-lg font-bold ${data.saldoProjetado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatBRL(data.saldoProjetado)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-2">
            {data.days.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma movimentação prevista neste período.</p>
            ) : (
              data.days.map((day) => (
                <Card key={day.date}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {new Date(day.date).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" })}
                      </p>
                      <p className={`text-sm font-bold ${day.saldoAcumulado >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        Saldo: {formatBRL(day.saldoAcumulado)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {day.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.description}</span>
                          <span className={item.type === "entrada" ? "text-emerald-600" : "text-red-600"}>
                            {item.type === "entrada" ? "+" : "-"}
                            {formatBRL(item.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
