"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, ChevronDown, CheckCircle2, RotateCcw } from "lucide-react";
import { LOAN_FREQUENCIES, LOAN_FREQUENCY_LABELS, FINANCIAL_SCOPES, FINANCIAL_SCOPE_LABELS, type FinancialScope, type LoanFrequency } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { FinancialAccount, FinancialLoan, FinancialLoanDetail } from "@/types";

export default function EmprestimosPage() {
  const [loans, setLoans] = useState<FinancialLoan[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<FinancialLoanDetail | null>(null);

  function reload() {
    setLoading(true);
    adminFetch<FinancialLoan[]>("/financial/loans")
      .then(setLoans)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    adminFetch<FinancialAccount[]>("/financial/accounts").then(setAccounts);
  }, []);

  async function toggleExpand(loan: FinancialLoan) {
    if (expanded === loan.id) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(loan.id);
    const data = await adminFetch<FinancialLoanDetail>(`/financial/loans/${loan.id}`);
    setDetail(data);
  }

  async function toggleInstallment(installmentId: string, paid: boolean) {
    try {
      await adminFetch(`/financial/transactions/${installmentId}/${paid ? "unpay" : "pay"}`, { method: "PATCH" });
      const loan = loans.find((l) => l.id === expanded);
      if (loan) {
        const data = await adminFetch<FinancialLoanDetail>(`/financial/loans/${loan.id}`);
        setDetail(data);
      }
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar parcela");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empréstimos</h1>
          <p className="text-sm text-muted-foreground">
            O valor recebido conta como financiamento (não como lucro); as parcelas aparecem como saída.
          </p>
        </div>
        <LoanCreateDialog open={createOpen} onOpenChange={setCreateOpen} accounts={accounts} onSaved={reload} />
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : loans.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhum empréstimo cadastrado.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {loans.map((loan) => {
            const percent = loan.installmentsCount > 0 ? Math.round((loan.installmentsPaid / loan.installmentsCount) * 100) : 0;
            return (
              <Card key={loan.id}>
                <CardContent className="p-4">
                  <button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => toggleExpand(loan)}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{loan.description}</p>
                        <Badge variant="outline" className={loan.status === "quitado" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>
                          {loan.status === "quitado" ? "Quitado" : "Ativo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatBRL(loan.principalAmount)} recebido em {new Date(loan.receivedDate).toLocaleDateString("pt-BR")} ·{" "}
                        {LOAN_FREQUENCY_LABELS[loan.frequency]}
                      </p>
                    </div>
                    <ChevronDown className={`size-4 shrink-0 transition-transform ${expanded === loan.id ? "rotate-180" : ""}`} />
                  </button>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total pago</p>
                      <p className="text-sm font-bold text-emerald-600">{formatBRL(loan.totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total restante</p>
                      <p className="text-sm font-bold text-red-600">{formatBRL(loan.totalRemaining)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Próximo pagamento</p>
                      <p className="text-sm font-bold">{loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString("pt-BR") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Parcelas restantes</p>
                      <p className="text-sm font-bold">
                        {loan.installmentsRemaining}/{loan.installmentsCount}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>

                  {expanded === loan.id && (
                    <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3">
                      {!detail ? (
                        <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
                      ) : (
                        detail.installments.map((inst) => (
                          <div key={inst.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/50">
                            <span className="text-muted-foreground">
                              Parcela {inst.installmentNumber} · {new Date(inst.dueDate ?? inst.date).toLocaleDateString("pt-BR")}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatBRL(inst.amount)}</span>
                              <button onClick={() => toggleInstallment(inst.id, inst.paid)} title={inst.paid ? "Desmarcar" : "Marcar como paga"}>
                                {inst.paid ? (
                                  <RotateCcw className="size-4 text-muted-foreground" />
                                ) : (
                                  <CheckCircle2 className="size-4 text-emerald-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
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

function LoanCreateDialog({
  open,
  onOpenChange,
  accounts,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  accounts: FinancialAccount[];
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<FinancialScope>("empresa");
  const [principalAmount, setPrincipalAmount] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [totalToPay, setTotalToPay] = useState("");
  const [frequency, setFrequency] = useState<LoanFrequency>("diaria_seg_sab");
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState("__none__");

  const previewCount =
    Number(totalToPay.replace(",", ".")) > 0 && Number(installmentAmount.replace(",", ".")) > 0
      ? Math.ceil(Number(totalToPay.replace(",", ".")) / Number(installmentAmount.replace(",", ".")))
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const principal = Number(principalAmount.replace(",", "."));
    const installment = Number(installmentAmount.replace(",", "."));
    const total = Number((totalToPay || principalAmount).replace(",", "."));
    if (!description.trim() || Number.isNaN(principal) || principal <= 0 || Number.isNaN(installment) || installment <= 0) {
      toast.error("Preencha descrição, valor recebido e valor da parcela");
      return;
    }

    setSaving(true);
    try {
      await adminFetch("/financial/loans", {
        method: "POST",
        body: {
          description: description.trim(),
          scope,
          principalAmount: principal,
          receivedDate: new Date(receivedDate).toISOString(),
          installmentAmount: installment,
          totalToPay: total,
          frequency,
          firstDueDate: new Date(firstDueDate).toISOString(),
          accountId: accountId === "__none__" ? null : accountId,
        },
      });
      toast.success("Empréstimo cadastrado — parcelas geradas automaticamente");
      onOpenChange(false);
      setDescription("");
      setPrincipalAmount("");
      setInstallmentAmount("");
      setTotalToPay("");
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao cadastrar empréstimo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" /> Novo empréstimo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo empréstimo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="loan-desc">Descrição</Label>
            <Input id="loan-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Empréstimo capital de giro" required />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              {FINANCIAL_SCOPES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    scope === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {FINANCIAL_SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-principal">Valor recebido</Label>
              <Input id="loan-principal" inputMode="decimal" value={principalAmount} onChange={(e) => setPrincipalAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan-received">Data que recebeu</Label>
              <Input id="loan-received" type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-installment">Valor da parcela</Label>
              <Input id="loan-installment" inputMode="decimal" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan-total">Total a pagar</Label>
              <Input
                id="loan-total"
                inputMode="decimal"
                value={totalToPay}
                onChange={(e) => setTotalToPay(e.target.value)}
                placeholder={principalAmount || "= valor recebido"}
              />
            </div>
          </div>
          {previewCount && <p className="text-xs text-muted-foreground">≈ {previewCount} parcelas serão geradas automaticamente.</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as LoanFrequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {LOAN_FREQUENCY_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loan-first-due">1º vencimento</Label>
              <Input id="loan-first-due" type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta que recebeu</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />} Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
