import { calculateInstallments, type FeeRow, type InstallmentOption } from "@flashcell/shared";
import { db } from "../db/client.js";
import { paymentFees } from "../db/schema.js";
import { eq } from "drizzle-orm";

function toFeeRow(r: typeof paymentFees.$inferSelect): FeeRow {
  return {
    method: r.method as FeeRow["method"],
    installments: r.installments,
    feePercent: Number(r.feePercent),
    monthlyRate: r.monthlyRate != null ? Number(r.monthlyRate) : undefined,
  };
}

export async function getFeesForMachine(machineId: string): Promise<FeeRow[]> {
  const rows = await db.select().from(paymentFees).where(eq(paymentFees.machineId, machineId));
  return rows.map(toFeeRow);
}

export async function getAllFeesByMachine(): Promise<Map<string, FeeRow[]>> {
  const rows = await db.select().from(paymentFees);
  const map = new Map<string, FeeRow[]>();
  for (const r of rows) {
    const list = map.get(r.machineId) ?? [];
    list.push(toFeeRow(r));
    map.set(r.machineId, list);
  }
  return map;
}

export function pricingFor(price: string | number, fees: FeeRow[]): InstallmentOption[] {
  return calculateInstallments(Number(price), fees);
}
