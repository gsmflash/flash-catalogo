"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { FINANCIAL_METHOD_LABELS, FINANCIAL_METHODS, FINANCIAL_SCOPE_LABELS, FINANCIAL_SCOPES } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { AdminProduct, FinancialAccount, FinancialCategory, FinancialTransaction } from "@/types";

interface TransactionFormDialogProps {
  type: "entrada" | "saida";
  categories: FinancialCategory[];
  accounts: FinancialAccount[];
  editing?: FinancialTransaction | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved: () => void;
  /** Pré-marca como pendente com foco em vencimento — usado nas telas de Contas a Pagar/Receber. */
  defaultPending?: boolean;
  hideTrigger?: boolean;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return new Date(iso).toISOString().slice(0, 10);
}

export function TransactionFormDialog({
  type,
  categories,
  accounts,
  editing,
  open: controlledOpen,
  onOpenChange,
  onSaved,
  defaultPending = false,
  hideTrigger = false,
}: TransactionFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [feePercent, setFeePercent] = useState("");
  const [date, setDate] = useState(toDateInputValue(null));
  const [dueDate, setDueDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [scope, setScope] = useState<(typeof FINANCIAL_SCOPES)[number]>("empresa");
  const [method, setMethod] = useState<string>("__none__");
  const [accountId, setAccountId] = useState<string>("__none__");
  const [clientName, setClientName] = useState("");
  const [productId, setProductId] = useState<string>("__none__");
  const [costAmount, setCostAmount] = useState("");
  const [note, setNote] = useState("");
  const [paid, setPaid] = useState(!defaultPending);
  const [recurring, setRecurring] = useState(false);

  const categoryKind = type === "entrada" ? "entrada" : scope === "pessoal" ? "saida_pessoal" : "saida_empresa";
  const kindCategories = categories.filter((c) => c.kind === categoryKind && c.active);

  useEffect(() => {
    if (!open) return;
    adminFetch<AdminProduct[]>("/products/admin").then(setProducts).catch(() => setProducts([]));

    if (editing) {
      setDescription(editing.description);
      setAmount(editing.amount);
      setGrossAmount(editing.grossAmount ?? "");
      setFeePercent(editing.feePercent ?? "");
      setDate(toDateInputValue(editing.date));
      setDueDate(editing.dueDate ? toDateInputValue(editing.dueDate) : "");
      setCategoryId(editing.categoryId ?? "");
      setScope(editing.scope);
      setMethod(editing.method ?? "__none__");
      setAccountId(editing.accountId ?? "__none__");
      setClientName(editing.clientName ?? "");
      setProductId(editing.productId ?? "__none__");
      setCostAmount(editing.costAmount ?? "");
      setNote(editing.note ?? "");
      setPaid(editing.paid);
      setRecurring(editing.recurring);
    } else {
      setDescription("");
      setAmount("");
      setGrossAmount("");
      setFeePercent("");
      setDate(toDateInputValue(null));
      setDueDate("");
      setCategoryId("");
      setScope("empresa");
      setMethod("__none__");
      setAccountId("__none__");
      setClientName("");
      setProductId("__none__");
      setCostAmount("");
      setNote("");
      setPaid(!defaultPending);
      setRecurring(false);
    }
  }, [open, editing, defaultPending]);

  function applyFeeCalc(gross: string, fee: string) {
    const g = Number(gross.replace(",", "."));
    const f = Number(fee.replace(",", "."));
    if (!Number.isNaN(g) && g > 0 && !Number.isNaN(f) && f >= 0) {
      setAmount((g * (1 - f / 100)).toFixed(2));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = Number(amount.replace(",", "."));
    if (!description.trim() || Number.isNaN(amountNum) || amountNum <= 0) {
      toast.error("Preencha descrição e um valor válido");
      return;
    }
    if (!categoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    setSaving(true);
    try {
      const body = {
        type,
        scope,
        description: description.trim(),
        amount: amountNum,
        grossAmount: grossAmount ? Number(grossAmount.replace(",", ".")) : null,
        feePercent: feePercent ? Number(feePercent.replace(",", ".")) : null,
        categoryId,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        paid,
        method: method === "__none__" ? null : method,
        accountId: accountId === "__none__" ? null : accountId,
        clientName: clientName.trim() || null,
        productId: productId === "__none__" ? null : productId,
        costAmount: costAmount ? Number(costAmount.replace(",", ".")) : null,
        note: note.trim() || null,
        recurring,
        recurrenceDay: recurring ? new Date(dueDate || date).getDate() : null,
      };

      if (editing) {
        await adminFetch(`/financial/transactions/${editing.id}`, { method: "PUT", body });
        toast.success(type === "entrada" ? "Entrada atualizada" : "Saída atualizada");
      } else {
        await adminFetch("/financial/transactions", { method: "POST", body });
        toast.success(type === "entrada" ? "Entrada registrada" : "Saída registrada");
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar lançamento");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="size-4" /> {type === "entrada" ? "Nova entrada" : "Nova saída"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar" : "Nova"} {type === "entrada" ? "entrada" : "saída"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="tx-desc">Descrição</Label>
            <Input
              id="tx-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "entrada" ? "Ex: Venda iPhone 13" : "Ex: Energia da loja"}
              autoFocus
              required
            />
          </div>

          {type === "saida" && (
            <div className="space-y-2">
              <Label>Tipo de despesa</Label>
              <div className="grid grid-cols-2 gap-2">
                {FINANCIAL_SCOPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setScope(s);
                      setCategoryId("");
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      scope === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {FINANCIAL_SCOPE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tx-amount">Valor {type === "entrada" && grossAmount ? "(líquido)" : ""}</Label>
              <Input
                id="tx-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="R$ 0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-date">Data</Label>
              <Input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>

          {type === "entrada" && (
            <div className="rounded-lg border border-dashed border-border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Venda com taxa? Informe o valor bruto e a taxa — o valor líquido é calculado automaticamente.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor bruto</Label>
                  <Input
                    inputMode="decimal"
                    value={grossAmount}
                    onChange={(e) => {
                      setGrossAmount(e.target.value);
                      applyFeeCalc(e.target.value, feePercent);
                    }}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Taxa %</Label>
                  <Input
                    inputMode="decimal"
                    value={feePercent}
                    onChange={(e) => {
                      setFeePercent(e.target.value);
                      applyFeeCalc(grossAmount, e.target.value);
                    }}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {kindCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma de {type === "entrada" ? "recebimento" : "pagamento"}</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {FINANCIAL_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {FINANCIAL_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
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
          </div>

          {type === "entrada" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tx-client">Cliente</Label>
                <Input id="tx-client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label>Venda relacionada</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">—</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.brand} {p.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {type === "entrada" && productId !== "__none__" && (
            <div className="space-y-2">
              <Label htmlFor="tx-cost" className="text-xs">
                Custo do produto (opcional — usado para calcular o lucro bruto real)
              </Label>
              <Input id="tx-cost" inputMode="decimal" value={costAmount} onChange={(e) => setCostAmount(e.target.value)} className="h-9" />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">{type === "entrada" ? "Recebido agora" : "Pago"}</p>
              <p className="text-xs text-muted-foreground">
                {paid ? "Já entrou no saldo" : type === "entrada" ? "A receber" : "Pendente"}
              </p>
            </div>
            <Switch checked={paid} onCheckedChange={setPaid} />
          </div>

          {!paid && (
            <div className="space-y-2">
              <Label htmlFor="tx-due">Vencimento</Label>
              <Input id="tx-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}

          {type === "saida" && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Despesa recorrente</p>
                <p className="text-xs text-muted-foreground">Gera a próxima cobrança automaticamente ao marcar como paga</p>
              </div>
              <Switch checked={recurring} onCheckedChange={setRecurring} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tx-note">Observação</Label>
            <Textarea id="tx-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
