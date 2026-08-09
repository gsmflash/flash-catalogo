"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRightLeft, Calculator, Loader2, Save, Search, Trash2 } from "lucide-react";
import { computeFromCharge, computeFromNet, type PaymentMethod } from "@flashcell/shared";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PaymentMachine, PaymentSimulation } from "@/types";

type FormaPagamento = "pix" | "debito" | "credito_avista" | "parcelado";
type CalcMode = "charge" | "net";

const FORMA_LABELS: Record<FormaPagamento, string> = {
  pix: "Pix",
  debito: "Débito",
  credito_avista: "Crédito à vista",
  parcelado: "Parcelado",
};

export default function SimuladorPage() {
  const [machines, setMachines] = useState<PaymentMachine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(true);

  const [machineId, setMachineId] = useState<string>("");
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [installments, setInstallments] = useState<string>("2");
  const [mode, setMode] = useState<CalcMode>("charge");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch<PaymentMachine[]>("/payments/machines").then((data) => {
      setMachines(data);
      setMachineId(data.find((m) => m.active)?.id ?? data[0]?.id ?? "");
      setLoadingMachines(false);
    });
  }, []);

  const machine = machines.find((m) => m.id === machineId);

  const availableFormas = useMemo<FormaPagamento[]>(() => {
    if (!machine) return [];
    const methods = new Set(machine.fees.map((f) => f.method));
    const formas: FormaPagamento[] = [];
    if (methods.has("pix")) formas.push("pix");
    if (methods.has("debito")) formas.push("debito");
    if (methods.has("credito")) {
      formas.push("credito_avista");
      if (machine.fees.some((f) => f.method === "credito" && f.installments > 1)) formas.push("parcelado");
    }
    return formas;
  }, [machine]);

  useEffect(() => {
    if (availableFormas.length > 0 && !availableFormas.includes(forma)) setForma(availableFormas[0]);
  }, [availableFormas, forma]);

  const installmentOptions = useMemo(() => {
    if (!machine) return [];
    return machine.fees
      .filter((f) => f.method === "credito" && f.installments > 1)
      .map((f) => f.installments)
      .sort((a, b) => a - b);
  }, [machine]);

  useEffect(() => {
    if (forma === "parcelado" && installmentOptions.length > 0 && !installmentOptions.includes(Number(installments))) {
      setInstallments(installmentOptions[0].toString());
    }
  }, [forma, installmentOptions, installments]);

  const selectedMethod: PaymentMethod = forma === "credito_avista" || forma === "parcelado" ? "credito" : forma;
  const selectedInstallments = forma === "parcelado" ? Number(installments) : 1;

  const fee = machine?.fees.find((f) => f.method === selectedMethod && f.installments === selectedInstallments);
  const feePercent = fee ? Number(fee.feePercent) : 0;
  const monthlyRate = fee?.monthlyRate != null ? Number(fee.monthlyRate) : undefined;

  const numericAmount = Number(amount.replace(",", "."));
  const result = useMemo(() => {
    if (!fee || Number.isNaN(numericAmount) || numericAmount <= 0) return null;
    return mode === "charge"
      ? computeFromCharge(numericAmount, feePercent, monthlyRate, selectedInstallments)
      : computeFromNet(numericAmount, feePercent, monthlyRate, selectedInstallments);
  }, [fee, numericAmount, feePercent, monthlyRate, selectedInstallments, mode]);

  /** Effective total % (feeAmount/chargeAmount), correct for both flat and compound (PagBank-style) fees. */
  const effectivePercent = result && result.chargeAmount > 0 ? (result.feeAmount / result.chargeAmount) * 100 : feePercent;

  async function handleSaveSimulation() {
    if (!machine || !result) return;
    setSaving(true);
    try {
      await adminFetch("/simulations", {
        method: "POST",
        body: {
          machineId: machine.id,
          machineName: machine.name,
          method: selectedMethod,
          installments: selectedInstallments,
          mode,
          inputAmount: numericAmount,
          chargeAmount: result.chargeAmount,
          netAmount: result.netAmount,
          feeAmount: result.feeAmount,
          feePercent: effectivePercent,
        },
      });
      toast.success("Simulação salva no histórico");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar simulação");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Simulador de Custos</h1>
        <p className="text-sm text-muted-foreground">
          Calcule o valor cobrado, a taxa aplicada e o valor líquido recebido para qualquer operadora e forma de pagamento.
        </p>
      </div>

      <Tabs defaultValue="calculadora">
        <TabsList>
          <TabsTrigger value="calculadora" className="gap-1.5">
            <Calculator className="size-4" /> Calculadora
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5">
            <Search className="size-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculadora">
          {loadingMachines ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da simulação</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label>Operadora</Label>
                    <Select value={machineId} onValueChange={setMachineId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} {!m.active && "(inativa)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Select value={forma} onValueChange={(v) => setForma(v as FormaPagamento)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFormas.map((f) => (
                          <SelectItem key={f} value={f}>
                            {FORMA_LABELS[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {forma === "parcelado" && (
                    <div className="space-y-2">
                      <Label>Número de parcelas</Label>
                      <Select value={installments} onValueChange={setInstallments}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {installmentOptions.map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n}x
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{mode === "charge" ? "Valor do produto (venda)" : "Valor líquido que deseja receber"}</Label>
                      <button
                        type="button"
                        onClick={() => setMode((m) => (m === "charge" ? "net" : "charge"))}
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ArrowRightLeft className="size-3.5" />
                        {mode === "charge" ? "Calcular a partir do valor líquido" : "Calcular a partir do valor da venda"}
                      </button>
                    </div>
                    <Input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="R$ 0,00"
                      inputMode="decimal"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resultado</CardTitle>
                </CardHeader>
                <CardContent>
                  {!result ? (
                    <p className="text-sm text-muted-foreground">Informe um valor para ver o cálculo.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                        <p className="text-xs text-muted-foreground">Valor a cobrar do cliente</p>
                        <p className="text-3xl font-extrabold text-primary">{formatBRL(result.chargeAmount)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Taxa aplicada</p>
                          <p className="text-lg font-semibold">{effectivePercent.toFixed(2)}%</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Valor descontado</p>
                          <p className="text-lg font-semibold">{formatBRL(result.feeAmount)}</p>
                        </div>
                        <div className="col-span-2 rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Valor líquido recebido</p>
                          <p className="text-lg font-semibold text-emerald-600">{formatBRL(result.netAmount)}</p>
                        </div>
                      </div>

                      <Button onClick={handleSaveSimulation} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Salvar no histórico
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico">
          <HistoricoTab machines={machines} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function feeLabel(method: PaymentMethod, installments: number): string {
  if (method === "pix") return "Pix";
  if (method === "debito") return "Débito";
  return installments === 1 ? "Crédito à vista" : `${installments}x`;
}

function HistoricoTab({ machines }: { machines: PaymentMachine[] }) {
  const [items, setItems] = useState<PaymentSimulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [machineFilter, setMachineFilter] = useState<string>("all");

  function reload() {
    setLoading(true);
    const params = new URLSearchParams({ pageSize: "50" });
    if (q) params.set("q", q);
    if (machineFilter !== "all") params.set("machineId", machineFilter);
    adminFetch<{ items: PaymentSimulation[] }>(`/simulations?${params.toString()}`)
      .then((res) => setItems(res.items))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [q, machineFilter]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta simulação do histórico?")) return;
    try {
      await adminFetch(`/simulations/${id}`, { method: "DELETE" });
      toast.success("Simulação excluída");
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao excluir simulação");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por operadora ou forma..." className="sm:max-w-xs" />
        <Select value={machineFilter} onValueChange={setMachineFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as operadoras</SelectItem>
            {machines.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma simulação salva ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Operadora</th>
                <th className="px-4 py-3">Forma</th>
                <th className="px-4 py-3 text-right">Taxa</th>
                <th className="px-4 py-3 text-right">Valor cobrado</th>
                <th className="px-4 py-3 text-right">Valor líquido</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((sim) => (
                <tr key={sim.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(sim.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 font-medium">{sim.machineName}</td>
                  <td className="px-4 py-3">{feeLabel(sim.method, sim.installments)}</td>
                  <td className="px-4 py-3 text-right">{Number(sim.feePercent).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-right">{formatBRL(sim.chargeAmount)}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{formatBRL(sim.netAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(sim.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
