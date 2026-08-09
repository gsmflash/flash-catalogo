export const PRODUCT_STATUSES = [
  "disponivel",
  "ultima_unidade",
  "em_breve",
  "vendido",
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  disponivel: "Disponível",
  ultima_unidade: "Última unidade",
  em_breve: "Em breve",
  vendido: "Vendido",
};

/** Statuses visible on the public catalog. "vendido" is hidden but kept in the DB. */
export const PUBLIC_PRODUCT_STATUSES: ProductStatus[] = [
  "disponivel",
  "ultima_unidade",
  "em_breve",
];

export const PAYMENT_METHODS = ["pix", "debito", "credito"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
};

export const MIN_INSTALLMENTS = 1;
export const MAX_INSTALLMENTS = 18;

export const USER_ROLES = ["admin", "editor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Default categories seeded on first install. Admin can edit/add more later. */
export const DEFAULT_CATEGORIES = [
  { name: "iPhone", slug: "iphone", sortOrder: 1 },
  { name: "Xiaomi", slug: "xiaomi", sortOrder: 2 },
  { name: "Samsung", slug: "samsung", sortOrder: 3 },
  { name: "Motorola", slug: "motorola", sortOrder: 4 },
] as const;

export interface DefaultFeeRow {
  method: PaymentMethod;
  installments: number;
  feePercent: number;
  /** Optional monthly compounding rate (%) — see FeeRow in pricing.ts. */
  monthlyRate?: number;
}

/**
 * Default InfiniteTap fee table (contactless/tap-only), editable in the
 * admin panel. Pix has no fee since it settles outside the card network.
 */
export const DEFAULT_INFINITETAP_FEES: DefaultFeeRow[] = [
  { method: "pix", installments: 1, feePercent: 0 },
  { method: "debito", installments: 1, feePercent: 1.37 },
  { method: "credito", installments: 1, feePercent: 3.15 },
  { method: "credito", installments: 2, feePercent: 5.39 },
  { method: "credito", installments: 3, feePercent: 6.12 },
  { method: "credito", installments: 4, feePercent: 6.85 },
  { method: "credito", installments: 5, feePercent: 7.57 },
  { method: "credito", installments: 6, feePercent: 8.28 },
  { method: "credito", installments: 7, feePercent: 8.99 },
  { method: "credito", installments: 8, feePercent: 9.69 },
  { method: "credito", installments: 9, feePercent: 10.38 },
  { method: "credito", installments: 10, feePercent: 11.06 },
  { method: "credito", installments: 11, feePercent: 11.74 },
  { method: "credito", installments: 12, feePercent: 12.4 },
];

/**
 * Default Mercado Pago fee table: fixed 2.84% sale fee plus an additional
 * installment surcharge (totals below already include the fixed fee). No
 * débito or Pix option for this acquirer.
 */
export const DEFAULT_MERCADOPAGO_FEES: DefaultFeeRow[] = [
  { method: "credito", installments: 1, feePercent: 2.84 },
  { method: "credito", installments: 2, feePercent: 4.54 },
  { method: "credito", installments: 3, feePercent: 5.39 },
  { method: "credito", installments: 4, feePercent: 6.24 },
  { method: "credito", installments: 5, feePercent: 7.09 },
  { method: "credito", installments: 6, feePercent: 7.94 },
  { method: "credito", installments: 7, feePercent: 8.79 },
  { method: "credito", installments: 8, feePercent: 9.64 },
  { method: "credito", installments: 9, feePercent: 10.49 },
  { method: "credito", installments: 10, feePercent: 11.34 },
  { method: "credito", installments: 11, feePercent: 12.19 },
  { method: "credito", installments: 12, feePercent: 13.04 },
  { method: "credito", installments: 13, feePercent: 13.89 },
  { method: "credito", installments: 14, feePercent: 14.74 },
  { method: "credito", installments: 15, feePercent: 15.59 },
  { method: "credito", installments: 16, feePercent: 16.44 },
  { method: "credito", installments: 17, feePercent: 17.29 },
  { method: "credito", installments: 18, feePercent: 18.14 },
];

/**
 * Default PagBank fee table. Unlike the other acquirers, PagBank's installment
 * fee is not a flat percentage per installment count — it's a fixed
 * "taxa de intermediação" (varies by installment tier) plus a "taxa de
 * parcelamento" that compounds monthly over the plan's settlement time
 * (see monthlyRate/compoundFactor in pricing.ts). Débito and crédito à vista
 * have no monthly compounding since there's nothing to settle over time.
 */
export const DEFAULT_PAGBANK_FEES: DefaultFeeRow[] = [
  { method: "debito", installments: 1, feePercent: 1.59 },
  { method: "credito", installments: 1, feePercent: 3.59 },
  // 2x a 6x: taxa de intermediação 2,59% + taxa de parcelamento 2,03% a.m.
  { method: "credito", installments: 2, feePercent: 2.59, monthlyRate: 2.03 },
  { method: "credito", installments: 3, feePercent: 2.59, monthlyRate: 2.03 },
  { method: "credito", installments: 4, feePercent: 2.59, monthlyRate: 2.03 },
  { method: "credito", installments: 5, feePercent: 2.59, monthlyRate: 2.03 },
  { method: "credito", installments: 6, feePercent: 2.59, monthlyRate: 2.03 },
  // 7x a 12x: taxa de intermediação 2,79% + taxa de parcelamento 2,03% a.m.
  { method: "credito", installments: 7, feePercent: 2.79, monthlyRate: 2.03 },
  { method: "credito", installments: 8, feePercent: 2.79, monthlyRate: 2.03 },
  { method: "credito", installments: 9, feePercent: 2.79, monthlyRate: 2.03 },
  { method: "credito", installments: 10, feePercent: 2.79, monthlyRate: 2.03 },
  { method: "credito", installments: 11, feePercent: 2.79, monthlyRate: 2.03 },
  { method: "credito", installments: 12, feePercent: 2.79, monthlyRate: 2.03 },
  // 13x a 18x: taxa de intermediação 3,59% + taxa de parcelamento 2,03% a.m.
  { method: "credito", installments: 13, feePercent: 3.59, monthlyRate: 2.03 },
  { method: "credito", installments: 14, feePercent: 3.59, monthlyRate: 2.03 },
  { method: "credito", installments: 15, feePercent: 3.59, monthlyRate: 2.03 },
  { method: "credito", installments: 16, feePercent: 3.59, monthlyRate: 2.03 },
  { method: "credito", installments: 17, feePercent: 3.59, monthlyRate: 2.03 },
  { method: "credito", installments: 18, feePercent: 3.59, monthlyRate: 2.03 },
];

/**
 * Default payment machines/acquirers seeded on first install. Adding a new
 * acquirer in the future is just another entry here (or via the admin panel) —
 * no calculation logic needs to change, since calculateInstallments() is
 * fully generic over a machine's fee table.
 */
export const DEFAULT_PAYMENT_MACHINES: Array<{
  name: string;
  provider: string;
  active: boolean;
  maxInstallments: number;
  settlementType: string;
  fees: DefaultFeeRow[];
}> = [
  {
    name: "InfiniteTap",
    provider: "InfinitePay",
    active: true,
    maxInstallments: 12,
    settlementType: "Aproximação (Infinite Tap)",
    fees: DEFAULT_INFINITETAP_FEES,
  },
  {
    name: "Mercado Pago",
    provider: "Mercado Pago",
    active: true,
    maxInstallments: 18,
    settlementType: "Maquininha e Link de Pagamento",
    fees: DEFAULT_MERCADOPAGO_FEES,
  },
  {
    name: "PagBank",
    provider: "PagBank",
    active: true,
    maxInstallments: 18,
    settlementType: "Maquininha e Link de Pagamento",
    fees: DEFAULT_PAGBANK_FEES,
  },
];
