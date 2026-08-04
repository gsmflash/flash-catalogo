"use client";

import { useMemo, useState } from "react";
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

  const pricing = useMemo(() => {
    if (!selectedMachine) return [];
    const fees: FeeRow[] = selectedMachine.fees.map((f) => ({
      method: f.method,
      installments: f.installments,
      feePercent: Number(f.feePercent),
    }));
    return calculateInstallments(Number(price), fees);
  }, [price, selectedMachine]);

  if (machines.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {machines.length > 1 && (
        <Tabs value={machineId} onValueChange={setMachineId}>
          <TabsList className="h-auto w-full gap-1 bg-secondary/60 p-1">
            {machines.map((machine) => (
              <TabsTrigger
                key={machine.id}
                value={machine.id}
                className="flex-1 rounded-full py-2 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-gold sm:text-sm"
              >
                {machine.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <InstallmentTable pricing={pricing} />
    </div>
  );
}
