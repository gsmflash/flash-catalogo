"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { adminFetch, ApiError } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PaymentMachine } from "@/types";

export default function FinanceiroPage() {
  const [machines, setMachines] = useState<PaymentMachine[]>([]);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  function reload() {
    adminFetch<PaymentMachine[]>("/payments/machines").then(setMachines);
  }

  useEffect(reload, []);

  async function handleSave(feeId: string) {
    const value = edited[feeId];
    if (value === undefined) return;
    const feePercent = Number(value.replace(",", "."));
    if (Number.isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
      toast.error("Informe uma taxa válida entre 0 e 100");
      return;
    }

    setSavingId(feeId);
    try {
      await adminFetch(`/payments/fees/${feeId}`, { method: "PUT", body: { feePercent } });
      toast.success("Taxa atualizada — os preços de todos os produtos foram recalculados");
      setEdited((prev) => {
        const next = { ...prev };
        delete next[feeId];
        return next;
      });
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao atualizar taxa");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Máquinas e taxas. Ao alterar uma taxa, o preço parcelado de todos os produtos que usam essa máquina é
          recalculado automaticamente.
        </p>
      </div>

      {machines.map((machine) => (
        <Card key={machine.id}>
          <CardHeader>
            <CardTitle>
              {machine.name} <span className="font-normal text-muted-foreground">· {machine.provider}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {machine.fees.map((fee) => {
                const label = fee.method === "debito" ? "Débito" : fee.installments === 1 ? "Crédito à vista" : `${fee.installments}x`;
                const value = edited[fee.id] ?? fee.feePercent;
                const hasChange = edited[fee.id] !== undefined && edited[fee.id] !== fee.feePercent;

                return (
                  <div key={fee.id} className="space-y-1.5 rounded-lg border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <div className="flex items-center gap-1">
                      <Input
                        value={value}
                        onChange={(e) => setEdited((prev) => ({ ...prev, [fee.id]: e.target.value }))}
                        className="h-8"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    {hasChange && (
                      <Button size="sm" variant="secondary" className="h-7 w-full gap-1 text-xs" onClick={() => handleSave(fee.id)} disabled={savingId === fee.id}>
                        {savingId === fee.id ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                        Salvar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
