import type { PaymentMethod } from "./constants.js";

export interface FeeRow {
  method: PaymentMethod;
  installments: number;
  feePercent: number;
}

export interface InstallmentOption {
  method: PaymentMethod;
  installments: number;
  feePercent: number;
  /** Total amount the customer pays for this option. */
  total: number;
  /** Amount per installment (equal to total when installments === 1). */
  perInstallment: number;
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Grosses up `basePrice` so the store always nets exactly `basePrice`,
 * regardless of the payment method/installments the customer picks:
 * total = basePrice / (1 - feePercent/100).
 */
export function calculateInstallments(
  basePrice: number,
  fees: FeeRow[]
): InstallmentOption[] {
  return fees
    .map((fee) => {
      const total = round2(basePrice / (1 - fee.feePercent / 100));
      const perInstallment = round2(total / fee.installments);
      return {
        method: fee.method,
        installments: fee.installments,
        feePercent: fee.feePercent,
        total,
        perInstallment,
      };
    })
    .sort((a, b) => {
      if (a.method !== b.method) return a.method === "debito" ? -1 : 1;
      return a.installments - b.installments;
    });
}

/** Convenience: the best (lowest) installment total, i.e. debit or 1x credit. */
export function getCashPrice(options: InstallmentOption[]): InstallmentOption | undefined {
  return options.find((o) => o.installments === 1 && o.method === "credito");
}

/** Highest installment count available (used for "12x de R$X" style highlights). */
export function getMaxInstallmentOption(
  options: InstallmentOption[]
): InstallmentOption | undefined {
  return options.reduce<InstallmentOption | undefined>((best, curr) => {
    if (curr.method !== "credito") return best;
    if (!best || curr.installments > best.installments) return curr;
    return best;
  }, undefined);
}
