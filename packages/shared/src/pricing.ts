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

const METHOD_ORDER: Record<PaymentMethod, number> = { pix: 0, debito: 1, credito: 2 };

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
      if (a.method !== b.method) return METHOD_ORDER[a.method] - METHOD_ORDER[b.method];
      return a.installments - b.installments;
    });
}

/** Convenience: the best (lowest) installment total, i.e. Pix, debit or 1x credit. */
export function getCashPrice(options: InstallmentOption[]): InstallmentOption | undefined {
  return (
    options.find((o) => o.method === "pix") ??
    options.find((o) => o.method === "debito") ??
    options.find((o) => o.installments === 1 && o.method === "credito")
  );
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

export interface FeeBreakdown {
  /** Gross amount charged to the customer. */
  chargeAmount: number;
  /** Amount the store actually receives after the acquirer's fee. */
  netAmount: number;
  /** chargeAmount - netAmount. */
  feeAmount: number;
}

/**
 * Forward mode: given the amount charged to the customer, computes how much
 * the store nets after the acquirer's fee is deducted.
 */
export function computeFromCharge(chargeAmount: number, feePercent: number): FeeBreakdown {
  const netAmount = round2(chargeAmount * (1 - feePercent / 100));
  return { chargeAmount: round2(chargeAmount), netAmount, feeAmount: round2(chargeAmount - netAmount) };
}

/**
 * Reverse mode: given the net amount the store wants to receive, computes how
 * much must be charged to the customer so that, after the acquirer's fee,
 * the store still nets exactly that amount.
 */
export function computeFromNet(netAmount: number, feePercent: number): FeeBreakdown {
  const chargeAmount = round2(netAmount / (1 - feePercent / 100));
  return { chargeAmount, netAmount: round2(netAmount), feeAmount: round2(chargeAmount - netAmount) };
}
