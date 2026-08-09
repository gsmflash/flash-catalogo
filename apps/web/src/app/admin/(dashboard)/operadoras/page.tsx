"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2, CreditCard } from "lucide-react";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { PaymentMachine } from "@/types";

function feeLabel(method: PaymentMethod, installments: number): string {
  if (method === "pix") return "Pix";
  if (method === "debito") return "Débito";
  return installments === 1 ? "Crédito à vista" : `${installments}x`;
}

export default function OperadorasPage() {
  const [machines, setMachines] = useState<PaymentMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedFees, setEditedFees] = useState<Record<string, string>>({});
  const [savingFeeId, setSavingFeeId] = useState<string | null>(null);
  const [deletingFeeId, setDeletingFeeId] = useState<string | null>(null);
  const [savingMachineId, setSavingMachineId] = useState<string | null>(null);
  const [machineDrafts, setMachineDrafts] = useState<Record<string, { maxInstallments: string; settlementType: string }>>({});
  const [newFeeDrafts, setNewFeeDrafts] = useState<Record<string, { method: PaymentMethod; installments: string; feePercent: string }>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newMachine, setNewMachine] = useState({ name: "", provider: "", maxInstallments: "12", settlementType: "" });

  function reload() {
    adminFetch<PaymentMachine[]>("/payments/machines").then((data) => {
      setMachines(data);
      setMachineDrafts(
        Object.fromEntries(
          data.map((m) => [m.id, { maxInstallments: m.maxInstallments?.toString() ?? "", settlementType: m.settlementType ?? "" }])
        )
      );
      setLoading(false);
    });
  }

  useEffect(reload, []);

  async function handleSaveFee(feeId: string) {
    const value = editedFees[feeId];
    if (value === undefined) return;
    const feePercent = Number(value.replace(",", "."));
    if (Number.isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
      toast.error("Informe uma taxa válida entre 0 e 100");
      return;
    }

    setSavingFeeId(feeId);
    try {
      await adminFetch(`/payments/fees/${feeId}`, { method: "PUT", body: { feePercent } });
      toast.success("Taxa atualizada — os preços de todos os produtos foram recalculados");
      setEditedFees((prev) => {
        const next = { ...prev };
        delete next[feeId];
        return next;
      });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar taxa");
    } finally {
      setSavingFeeId(null);
    }
  }

  async function handleDeleteFee(feeId: string) {
    if (!confirm("Remover esta taxa?")) return;
    setDeletingFeeId(feeId);
    try {
      await adminFetch(`/payments/fees/${feeId}`, { method: "DELETE" });
      toast.success("Taxa removida");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover taxa");
    } finally {
      setDeletingFeeId(null);
    }
  }

  async function handleAddFee(machineId: string) {
    const draft = newFeeDrafts[machineId] ?? { method: "credito", installments: "1", feePercent: "" };
    const installments = Number(draft.installments);
    const feePercent = Number(draft.feePercent.replace(",", "."));
    if (!Number.isInteger(installments) || installments < 1) {
      toast.error("Informe um número de parcelas válido");
      return;
    }
    if (Number.isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
      toast.error("Informe uma taxa válida entre 0 e 100");
      return;
    }

    try {
      await adminFetch("/payments/fees", { method: "POST", body: { machineId, method: draft.method, installments, feePercent } });
      toast.success("Taxa adicionada");
      setNewFeeDrafts((prev) => ({ ...prev, [machineId]: { method: "credito", installments: "1", feePercent: "" } }));
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao adicionar taxa");
    }
  }

  async function handleToggleActive(machine: PaymentMachine) {
    try {
      await adminFetch(`/payments/machines/${machine.id}`, { method: "PUT", body: { active: !machine.active } });
      toast.success(machine.active ? "Operadora desativada" : "Operadora ativada");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar operadora");
    }
  }

  async function handleSaveMachine(machineId: string) {
    const draft = machineDrafts[machineId];
    if (!draft) return;
    const maxInstallments = draft.maxInstallments ? Number(draft.maxInstallments) : null;
    if (draft.maxInstallments && (!Number.isInteger(maxInstallments) || (maxInstallments ?? 0) < 1)) {
      toast.error("Parcelamento máximo inválido");
      return;
    }

    setSavingMachineId(machineId);
    try {
      await adminFetch(`/payments/machines/${machineId}`, {
        method: "PUT",
        body: { maxInstallments, settlementType: draft.settlementType || null },
      });
      toast.success("Operadora atualizada");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar operadora");
    } finally {
      setSavingMachineId(null);
    }
  }

  async function handleDeleteMachine(machine: PaymentMachine) {
    if (!confirm(`Excluir a operadora "${machine.name}"? Produtos vinculados a ela devem ser reatribuídos antes.`)) return;
    try {
      await adminFetch(`/payments/machines/${machine.id}`, { method: "DELETE" });
      toast.success("Operadora excluída");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir operadora");
    }
  }

  async function handleCreateMachine(e: React.FormEvent) {
    e.preventDefault();
    if (!newMachine.name.trim() || !newMachine.provider.trim()) {
      toast.error("Preencha nome e provedor");
      return;
    }

    setCreating(true);
    try {
      await adminFetch("/payments/machines", {
        method: "POST",
        body: {
          name: newMachine.name.trim(),
          provider: newMachine.provider.trim(),
          active: true,
          maxInstallments: newMachine.maxInstallments ? Number(newMachine.maxInstallments) : null,
          settlementType: newMachine.settlementType || null,
        },
      });
      toast.success("Operadora criada — adicione as taxas abaixo");
      setCreateOpen(false);
      setNewMachine({ name: "", provider: "", maxInstallments: "12", settlementType: "" });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao criar operadora");
    } finally {
      setCreating(false);
    }
  }

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
          <h1 className="text-2xl font-bold">Operadoras</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre novas maquininhas/adquirentes e suas taxas sem precisar alterar código. Alterar uma taxa recalcula
            automaticamente o preço parcelado de todos os produtos que usam essa operadora.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="size-4" /> Nova operadora
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova operadora</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMachine} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="machine-name">Nome</Label>
                <Input
                  id="machine-name"
                  value={newMachine.name}
                  onChange={(e) => setNewMachine((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Stone"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="machine-provider">Provedor</Label>
                <Input
                  id="machine-provider"
                  value={newMachine.provider}
                  onChange={(e) => setNewMachine((prev) => ({ ...prev, provider: e.target.value }))}
                  placeholder="Ex: Stone"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="machine-max">Parcelamento máximo</Label>
                  <Input
                    id="machine-max"
                    type="number"
                    min={1}
                    value={newMachine.maxInstallments}
                    onChange={(e) => setNewMachine((prev) => ({ ...prev, maxInstallments: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="machine-settlement">Recebimento</Label>
                  <Input
                    id="machine-settlement"
                    value={newMachine.settlementType}
                    onChange={(e) => setNewMachine((prev) => ({ ...prev, settlementType: e.target.value }))}
                    placeholder="Ex: Maquininha física"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating ? <Loader2 className="size-4 animate-spin" /> : "Criar operadora"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {machines.map((machine) => {
        const draft = machineDrafts[machine.id] ?? { maxInstallments: "", settlementType: "" };
        const newFeeDraft = newFeeDrafts[machine.id] ?? { method: "credito" as PaymentMethod, installments: "1", feePercent: "" };

        return (
          <Card key={machine.id} className={!machine.active ? "opacity-60" : undefined}>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                {machine.name} <span className="font-normal text-muted-foreground">· {machine.provider}</span>
                {!machine.active && <Badge variant="outline">Inativa</Badge>}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${machine.id}`} className="text-xs text-muted-foreground">
                  Ativa
                </Label>
                <Switch id={`active-${machine.id}`} checked={machine.active} onCheckedChange={() => handleToggleActive(machine)} />
                <Button variant="ghost" size="icon" onClick={() => handleDeleteMachine(machine)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Parcelamento máximo</Label>
                  <Input
                    type="number"
                    min={1}
                    value={draft.maxInstallments}
                    onChange={(e) =>
                      setMachineDrafts((prev) => ({ ...prev, [machine.id]: { ...draft, maxInstallments: e.target.value } }))
                    }
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <Label className="text-xs text-muted-foreground">Forma de recebimento</Label>
                  <Input
                    value={draft.settlementType}
                    onChange={(e) =>
                      setMachineDrafts((prev) => ({ ...prev, [machine.id]: { ...draft, settlementType: e.target.value } }))
                    }
                    placeholder="Ex: Maquininha física"
                    className="h-9"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 gap-1.5"
                    onClick={() => handleSaveMachine(machine.id)}
                    disabled={savingMachineId === machine.id}
                  >
                    {savingMachineId === machine.id ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Salvar dados da operadora
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Taxas</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {machine.fees.map((fee) => {
                    const value = editedFees[fee.id] ?? fee.feePercent;
                    const hasChange = editedFees[fee.id] !== undefined && editedFees[fee.id] !== fee.feePercent;

                    return (
                      <div key={fee.id} className="space-y-1.5 rounded-lg border border-border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">{feeLabel(fee.method, fee.installments)}</p>
                          <button
                            type="button"
                            onClick={() => handleDeleteFee(fee.id)}
                            disabled={deletingFeeId === fee.id}
                            className="text-muted-foreground/60 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Input
                            value={value}
                            onChange={(e) => setEditedFees((prev) => ({ ...prev, [fee.id]: e.target.value }))}
                            className="h-8"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                        {hasChange && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-full gap-1 text-xs"
                            onClick={() => handleSaveFee(fee.id)}
                            disabled={savingFeeId === fee.id}
                          >
                            {savingFeeId === fee.id ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                            Salvar
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  <div className="space-y-1.5 rounded-lg border border-dashed border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground">Nova taxa</p>
                    <Select
                      value={newFeeDraft.method}
                      onValueChange={(v) =>
                        setNewFeeDrafts((prev) => ({ ...prev, [machine.id]: { ...newFeeDraft, method: v as PaymentMethod } }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {PAYMENT_METHOD_LABELS[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Parcelas"
                        value={newFeeDraft.installments}
                        onChange={(e) =>
                          setNewFeeDrafts((prev) => ({ ...prev, [machine.id]: { ...newFeeDraft, installments: e.target.value } }))
                        }
                        className="h-8"
                      />
                      <Input
                        placeholder="Taxa %"
                        value={newFeeDraft.feePercent}
                        onChange={(e) =>
                          setNewFeeDrafts((prev) => ({ ...prev, [machine.id]: { ...newFeeDraft, feePercent: e.target.value } }))
                        }
                        className="h-8"
                      />
                    </div>
                    <Button size="sm" variant="outline" className="h-7 w-full gap-1 text-xs" onClick={() => handleAddFee(machine.id)}>
                      <Plus className="size-3" /> Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
