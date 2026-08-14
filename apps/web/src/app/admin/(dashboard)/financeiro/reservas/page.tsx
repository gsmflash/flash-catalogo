"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, ArrowLeftRight, Trash2, Pencil, Plane } from "lucide-react";
import { TRAVEL_CATEGORY_PREFIX } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { dateInputToISO } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { FinancialAccount, FinancialReserve, FinancialTransaction, FinancialTransactionListResponse } from "@/types";

export default function ReservasPage() {
  const [reserves, setReserves] = useState<FinancialReserve[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [travelSpend, setTravelSpend] = useState(0);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [editingReserve, setEditingReserve] = useState<FinancialReserve | null>(null);

  const [transferReserve, setTransferReserve] = useState<FinancialReserve | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDirection, setTransferDirection] = useState<"deposito" | "retirada">("deposito");
  const [transferAccount, setTransferAccount] = useState("__none__");
  const [transferring, setTransferring] = useState(false);

  function reload() {
    setLoading(true);
    Promise.all([
      adminFetch<FinancialReserve[]>("/financial/reserves"),
      adminFetch<FinancialTransactionListResponse>("/financial/transactions?type=saida&paid=true&pageSize=200"),
    ])
      .then(([reserveData, txData]) => {
        setReserves(reserveData);
        const spend = txData.items
          .filter((t) => t.category?.name.startsWith(TRAVEL_CATEGORY_PREFIX))
          .reduce((s, t) => s + Number(t.amount), 0);
        setTravelSpend(spend);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    adminFetch<FinancialAccount[]>("/financial/accounts").then(setAccounts);
  }, []);

  function openCreate() {
    setEditingReserve(null);
    setName("");
    setGoalAmount("");
    setDeadline("");
    setNote("");
    setCreateOpen(true);
  }

  function openEdit(reserve: FinancialReserve) {
    setEditingReserve(reserve);
    setName(reserve.name);
    setGoalAmount(reserve.goalAmount);
    setDeadline(reserve.deadline ? reserve.deadline.slice(0, 10) : "");
    setNote(reserve.note ?? "");
    setCreateOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const goal = Number(goalAmount.replace(",", "."));
    if (!name.trim() || Number.isNaN(goal) || goal <= 0) {
      toast.error("Preencha nome e uma meta válida");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        goalAmount: goal,
        deadline: deadline ? dateInputToISO(deadline) : null,
        note: note.trim() || null,
      };
      if (editingReserve) {
        await adminFetch(`/financial/reserves/${editingReserve.id}`, { method: "PUT", body });
        toast.success("Reserva atualizada");
      } else {
        await adminFetch("/financial/reserves", { method: "POST", body });
        toast.success("Reserva criada");
      }
      setCreateOpen(false);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar reserva");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(reserve: FinancialReserve) {
    if (!confirm(`Excluir a reserva "${reserve.name}"?`)) return;
    try {
      await adminFetch(`/financial/reserves/${reserve.id}`, { method: "DELETE" });
      toast.success("Reserva excluída");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir reserva");
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!transferReserve) return;
    const amount = Number(transferAmount.replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setTransferring(true);
    try {
      await adminFetch(`/financial/reserves/${transferReserve.id}/transfer`, {
        method: "POST",
        body: {
          amount,
          direction: transferDirection,
          accountId: transferAccount === "__none__" ? null : transferAccount,
          date: new Date().toISOString(),
        },
      });
      toast.success(transferDirection === "deposito" ? "Valor transferido para a reserva" : "Valor retirado da reserva");
      setTransferReserve(null);
      setTransferAmount("");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao transferir");
    } finally {
      setTransferring(false);
    }
  }

  const travelReserve = useMemo(() => reserves.find((r) => r.name.toLowerCase().includes("viagem")), [reserves]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reservas</h1>
          <p className="text-sm text-muted-foreground">
            Dinheiro separado por objetivo. Transferir para uma reserva remove esse valor do disponível para gastos comuns.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" /> Nova reserva
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingReserve ? "Editar reserva" : "Nova reserva"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="reserve-name">Nome</Label>
                <Input id="reserve-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Viagem setembro" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reserve-goal">Meta</Label>
                  <Input id="reserve-goal" inputMode="decimal" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reserve-deadline">Prazo</Label>
                  <Input id="reserve-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reserve-note">Observação</Label>
                <Textarea id="reserve-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Loader2 className="size-4 animate-spin" />} Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {travelReserve && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <Plane className="size-4 text-primary" />
            <CardTitle>Controle da viagem</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Orçamento da viagem</p>
              <p className="text-lg font-bold">{formatBRL(Number(travelReserve.goalAmount))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Já reservado</p>
              <p className="text-lg font-bold text-primary">{formatBRL(travelReserve.currentAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Já gasto</p>
              <p className="text-lg font-bold text-red-600">{formatBRL(travelSpend)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Restante</p>
              <p className="text-lg font-bold">{formatBRL(Math.max(0, Number(travelReserve.goalAmount) - travelSpend))}</p>
            </div>
            <p className="col-span-2 text-xs text-muted-foreground sm:col-span-4">
              Registre os gastos da viagem em Saídas usando as categorias &ldquo;Viagem - ...&rdquo; para que apareçam aqui automaticamente.
            </p>
          </CardContent>
        </Card>
      )}

      {reserves.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma reserva criada ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reserves.map((reserve) => (
            <Card key={reserve.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{reserve.name}</p>
                    {reserve.deadline && (
                      <p className="text-xs text-muted-foreground">Prazo: {new Date(reserve.deadline).toLocaleDateString("pt-BR")}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => openEdit(reserve)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDelete(reserve)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatBRL(reserve.currentAmount)}</span>
                    <span>{formatBRL(Number(reserve.goalAmount))}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, reserve.percent)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-medium text-primary">
                    {reserve.percent.toFixed(1)}% · falta {formatBRL(reserve.remaining)}
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setTransferReserve(reserve);
                    setTransferDirection("deposito");
                    setTransferAmount("");
                  }}
                >
                  <ArrowLeftRight className="size-3.5" /> Transferir
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!transferReserve} onOpenChange={(o) => !o && setTransferReserve(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir — {transferReserve?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransferDirection("deposito")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  transferDirection === "deposito" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                Depositar
              </button>
              <button
                type="button"
                onClick={() => setTransferDirection("retirada")}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  transferDirection === "retirada" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                Retirar
              </button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Valor</Label>
              <Input id="transfer-amount" inputMode="decimal" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} autoFocus required />
            </div>
            <div className="space-y-2">
              <Label>Conta de origem/destino</Label>
              <Select value={transferAccount} onValueChange={setTransferAccount}>
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
              <Button type="submit" disabled={transferring} className="gap-2">
                {transferring && <Loader2 className="size-4 animate-spin" />} Confirmar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
