"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, AlertTriangle, Gauge, Save } from "lucide-react";
import { computeBudgetUsage } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { FinancialBudget, FinancialCategory, FinancialSettingsData, FinancialTransactionListResponse } from "@/types";

export default function OrcamentosPage() {
  const [budgets, setBudgets] = useState<FinancialBudget[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const [dailyLimit, setDailyLimit] = useState<string | null>(null);
  const [dailyLimitInput, setDailyLimitInput] = useState("");
  const [spentToday, setSpentToday] = useState(0);
  const [savingLimit, setSavingLimit] = useState(false);

  function reload() {
    setLoading(true);
    adminFetch<FinancialBudget[]>("/financial/budgets")
      .then(setBudgets)
      .finally(() => setLoading(false));
  }

  function reloadDaily() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const params = new URLSearchParams({
      type: "saida",
      scope: "pessoal",
      paid: "true",
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
      pageSize: "100",
    });
    adminFetch<FinancialTransactionListResponse>(`/financial/transactions?${params.toString()}`).then((res) =>
      setSpentToday(res.items.reduce((s, i) => s + Number(i.amount), 0))
    );
  }

  useEffect(() => {
    reload();
    reloadDaily();
    adminFetch<FinancialCategory[]>("/financial/categories").then(setCategories);
    adminFetch<FinancialSettingsData>("/financial/settings").then((s) => {
      setDailyLimit(s.dailyPersonalLimit);
      setDailyLimitInput(s.dailyPersonalLimit ?? "");
    });
  }, []);

  const availableCategories = useMemo(
    () =>
      categories.filter(
        (c) => (c.kind === "saida_empresa" || c.kind === "saida_pessoal") && !budgets.some((b) => b.categoryId === c.id)
      ),
    [categories, budgets]
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const limit = Number(limitAmount.replace(",", "."));
    if (!categoryId || Number.isNaN(limit) || limit <= 0) {
      toast.error("Selecione a categoria e informe um limite válido");
      return;
    }
    setSaving(true);
    try {
      await adminFetch("/financial/budgets", { method: "POST", body: { categoryId, limitAmount: limit } });
      toast.success("Orçamento criado");
      setCreateOpen(false);
      setCategoryId("");
      setLimitAmount("");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar orçamento");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(budget: FinancialBudget) {
    if (!confirm(`Remover o orçamento de "${budget.categoryName}"?`)) return;
    try {
      await adminFetch(`/financial/budgets/${budget.id}`, { method: "DELETE" });
      toast.success("Orçamento removido");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover orçamento");
    }
  }

  async function handleSaveDailyLimit() {
    const value = dailyLimitInput.trim() === "" ? null : Number(dailyLimitInput.replace(",", "."));
    if (value !== null && (Number.isNaN(value) || value < 0)) {
      toast.error("Informe um limite válido");
      return;
    }
    setSavingLimit(true);
    try {
      await adminFetch("/financial/settings", { method: "PUT", body: { dailyPersonalLimit: value } });
      setDailyLimit(value?.toString() ?? null);
      toast.success("Limite diário atualizado");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar limite");
    } finally {
      setSavingLimit(false);
    }
  }

  const dailyLimitNum = dailyLimit ? Number(dailyLimit) : null;
  const dailyAvailable = dailyLimitNum !== null ? dailyLimitNum - spentToday : null;
  const dailyExceeded = dailyAvailable !== null && dailyAvailable < 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">Limite mensal por categoria — alerta em 80% e crítico em 100%.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Novo orçamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo orçamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.kind === "saida_pessoal" ? "(pessoal)" : "(empresa)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget-limit">Limite mensal</Label>
                <Input id="budget-limit" inputMode="decimal" value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)} required />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Loader2 className="size-4 animate-spin" />} Criar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className={dailyExceeded ? "border-red-300 bg-red-50" : undefined}>
        <CardHeader className="flex flex-row items-center gap-2">
          <Gauge className="size-4 text-primary" />
          <CardTitle>Limite diário de gastos pessoais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Limite por dia</Label>
              <Input inputMode="decimal" value={dailyLimitInput} onChange={(e) => setDailyLimitInput(e.target.value)} placeholder="Ex: 150" />
            </div>
            <Button variant="secondary" onClick={handleSaveDailyLimit} disabled={savingLimit} className="gap-1.5">
              {savingLimit ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Salvar
            </Button>
          </div>
          {dailyLimitNum !== null && (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Limite</p>
                <p className="font-bold">{formatBRL(dailyLimitNum)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gasto hoje</p>
                <p className="font-bold">{formatBRL(spentToday)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Disponível</p>
                <p className={`font-bold ${dailyExceeded ? "text-red-600" : "text-emerald-600"}`}>{formatBRL(dailyAvailable ?? 0)}</p>
              </div>
            </div>
          )}
          {dailyExceeded && (
            <div className="flex items-center gap-2 rounded-lg bg-red-100 p-2 text-xs text-red-700">
              <AlertTriangle className="size-3.5 shrink-0" /> Você ultrapassou o limite diário de gastos pessoais.
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : budgets.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum orçamento cadastrado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const usage = computeBudgetUsage(Number(budget.limitAmount), budget.spentAmount);
            const barColor = usage.status === "critical" ? "bg-red-500" : usage.status === "warning" ? "bg-amber-500" : "bg-primary";
            return (
              <Card key={budget.id}>
                <CardContent className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{budget.categoryName}</p>
                      <p className="text-xs text-muted-foreground">{budget.categoryKind === "saida_pessoal" ? "Pessoal" : "Empresa"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDelete(budget)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatBRL(budget.spentAmount)} realizado</span>
                    <span>{formatBRL(Number(budget.limitAmount))} orçado</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(100, usage.percent)}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={usage.status === "critical" ? "font-semibold text-red-600" : usage.status === "warning" ? "font-semibold text-amber-600" : "text-muted-foreground"}>
                      {usage.percent.toFixed(0)}% utilizado
                    </span>
                    <span className="text-muted-foreground">
                      {usage.remaining >= 0 ? `restam ${formatBRL(usage.remaining)}` : `excedeu ${formatBRL(-usage.remaining)}`}
                    </span>
                  </div>
                  {usage.status !== "ok" && (
                    <div
                      className={`flex items-center gap-1.5 rounded-lg p-2 text-xs ${
                        usage.status === "critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {usage.status === "critical" ? "Orçamento estourado" : "Perto do limite"}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
