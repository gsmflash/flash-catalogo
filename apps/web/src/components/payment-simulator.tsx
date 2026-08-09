"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { calculateInstallments, type FeeRow } from "@flashcell/shared";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstallmentTable } from "@/components/installment-table";
import type { PaymentMachine } from "@/types";

interface PaymentSimulatorProps {
  /** Raw base price (product.price) — the amount the store nets, before acquirer fees. */
  price: string | number;
  machines: PaymentMachine[];
  /** Product's assigned machine, pre-selected when present. */
  defaultMachineId?: string;
}

/** Splits a name like "InfinitePay (Infinite Tap)" into base name + parenthetical note. */
function splitMachineName(name: string): { base: string; note: string | null } {
  const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(name);
  return match ? { base: match[1], note: match[2] } : { base: name, note: null };
}

/**
 * Lets the customer pick which acquirer to simulate installments with.
 * Every acquirer is driven purely by its fee table + the shared
 * calculateInstallments() formula, so adding a new machine later (Stone,
 * PagBank, Cielo...) needs no changes here — it just shows up as a tab.
 */
export function PaymentSimulator({ price, machines, defaultMachineId }: PaymentSimulatorProps) {
  const [machineId, setMachineId] = useState(
    defaultMachineId && machines.some((m) => m.id === defaultMachineId) ? defaultMachineId : machines[0]?.id
  );

  const selectedMachine = machines.find((m) => m.id === machineId) ?? machines[0];
  const selectedName = selectedMachine ? splitMachineName(selectedMachine.name) : null;

  const pricing = useMemo(() => {
    if (!selectedMachine) return [];
    const fees: FeeRow[] = selectedMachine.fees
      .filter((f) => !selectedMachine.maxInstallments || f.installments <= selectedMachine.maxInstallments)
      .map((f) => ({
        method: f.method,
        installments: f.installments,
        feePercent: Number(f.feePercent),
        monthlyRate: f.monthlyRate != null ? Number(f.monthlyRate) : undefined,
      }));
    return calculateInstallments(Number(price), fees);
  }, [price, selectedMachine]);

  if (machines.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {machines.length > 1 && (
        <div className="flex flex-col gap-2">
          <Tabs value={machineId} onValueChange={setMachineId}>
            <TabsList className="h-auto w-full gap-1 bg-secondary/60 p-1">
              {machines.map((machine) => {
                const { base } = splitMachineName(machine.name);
                return (
                  <TabsTrigger
                    key={machine.id}
                    value={machine.id}
                    className="flex-1 whitespace-normal rounded-full py-2 text-xs font-medium leading-tight data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-gold sm:text-sm"
                  >
                    {base}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {selectedName?.note && (
            <p className="flex items-start gap-1.5 px-1 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              {selectedName.base}: apenas para pagamentos por aproximação ({selectedName.note}).
            </p>
          )}
        </div>
      )}

      <InstallmentTable pricing={pricing} />
    </div>
  );
}
