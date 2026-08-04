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

export const PAYMENT_METHODS = ["debito", "credito"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

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
}

/** Default InfinitePay fee table (Visa/Mastercard), editable in the admin panel. */
export const DEFAULT_INFINITEPAY_FEES: DefaultFeeRow[] = [
  { method: "debito", installments: 1, feePercent: 0.85 },
  { method: "credito", installments: 1, feePercent: 2.89 },
  { method: "credito", installments: 2, feePercent: 4.22 },
  { method: "credito", installments: 3, feePercent: 4.83 },
  { method: "credito", installments: 4, feePercent: 5.44 },
  { method: "credito", installments: 5, feePercent: 6.05 },
  { method: "credito", installments: 6, feePercent: 6.64 },
  { method: "credito", installments: 7, feePercent: 7.24 },
  { method: "credito", installments: 8, feePercent: 7.82 },
  { method: "credito", installments: 9, feePercent: 8.41 },
  { method: "credito", installments: 10, feePercent: 8.98 },
  { method: "credito", installments: 11, feePercent: 9.56 },
  { method: "credito", installments: 12, feePercent: 10.12 },
];

/** Default Mercado Pago fee table ("Parcelado Vendedor"), editable in the admin panel. */
export const DEFAULT_MERCADOPAGO_FEES: DefaultFeeRow[] = [
  { method: "debito", installments: 1, feePercent: 0.98 },
  { method: "credito", installments: 1, feePercent: 2.99 },
  { method: "credito", installments: 2, feePercent: 1.7 },
  { method: "credito", installments: 3, feePercent: 2.55 },
  { method: "credito", installments: 4, feePercent: 3.4 },
  { method: "credito", installments: 5, feePercent: 4.25 },
  { method: "credito", installments: 6, feePercent: 5.1 },
  { method: "credito", installments: 7, feePercent: 5.95 },
  { method: "credito", installments: 8, feePercent: 6.8 },
  { method: "credito", installments: 9, feePercent: 7.65 },
  { method: "credito", installments: 10, feePercent: 8.5 },
  { method: "credito", installments: 11, feePercent: 9.35 },
  { method: "credito", installments: 12, feePercent: 10.2 },
  { method: "credito", installments: 13, feePercent: 11.05 },
  { method: "credito", installments: 14, feePercent: 11.9 },
  { method: "credito", installments: 15, feePercent: 12.75 },
  { method: "credito", installments: 16, feePercent: 13.6 },
  { method: "credito", installments: 17, feePercent: 14.45 },
  { method: "credito", installments: 18, feePercent: 15.3 },
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
  fees: DefaultFeeRow[];
}> = [
  { name: "InfinitePay", provider: "InfinitePay", fees: DEFAULT_INFINITEPAY_FEES },
  { name: "Mercado Pago", provider: "Mercado Pago", fees: DEFAULT_MERCADOPAGO_FEES },
];
