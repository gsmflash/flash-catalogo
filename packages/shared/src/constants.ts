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

// ---------------------------------------------------------------------------
// Financeiro / Fluxo de Caixa
// ---------------------------------------------------------------------------

export const FINANCIAL_TRANSACTION_TYPES = ["entrada", "saida", "transferencia"] as const;
export type FinancialTransactionType = (typeof FINANCIAL_TRANSACTION_TYPES)[number];

export const FINANCIAL_SCOPES = ["empresa", "pessoal"] as const;
export type FinancialScope = (typeof FINANCIAL_SCOPES)[number];
export const FINANCIAL_SCOPE_LABELS: Record<FinancialScope, string> = {
  empresa: "Empresa",
  pessoal: "Pessoal",
};

export const FINANCIAL_CATEGORY_KINDS = ["entrada", "saida_empresa", "saida_pessoal"] as const;
export type FinancialCategoryKind = (typeof FINANCIAL_CATEGORY_KINDS)[number];

/** Seeded on first install; fully editable afterwards via /financeiro/configuracoes. */
export const DEFAULT_FINANCIAL_CATEGORIES: Array<{ name: string; kind: FinancialCategoryKind; sortOrder: number }> = [
  // Entradas
  { name: "Venda de celular", kind: "entrada", sortOrder: 1 },
  { name: "Venda de tablet", kind: "entrada", sortOrder: 2 },
  { name: "Venda de acessórios", kind: "entrada", sortOrder: 3 },
  { name: "Assistência técnica", kind: "entrada", sortOrder: 4 },
  { name: "Película", kind: "entrada", sortOrder: 5 },
  { name: "Capinha", kind: "entrada", sortOrder: 6 },
  { name: "Empréstimo/Financiamento", kind: "entrada", sortOrder: 7 },
  { name: "Outros", kind: "entrada", sortOrder: 8 },
  // Saídas — Empresa
  { name: "Compra de aparelhos", kind: "saida_empresa", sortOrder: 1 },
  { name: "Compra de acessórios", kind: "saida_empresa", sortOrder: 2 },
  { name: "Fornecedor", kind: "saida_empresa", sortOrder: 3 },
  { name: "Aluguel da loja", kind: "saida_empresa", sortOrder: 4 },
  { name: "Energia da loja", kind: "saida_empresa", sortOrder: 5 },
  { name: "Funcionária", kind: "saida_empresa", sortOrder: 6 },
  { name: "Internet", kind: "saida_empresa", sortOrder: 7 },
  { name: "Marketing", kind: "saida_empresa", sortOrder: 8 },
  { name: "Combustível", kind: "saida_empresa", sortOrder: 9 },
  { name: "Manutenção", kind: "saida_empresa", sortOrder: 10 },
  { name: "Impostos", kind: "saida_empresa", sortOrder: 11 },
  { name: "Empréstimo", kind: "saida_empresa", sortOrder: 12 },
  { name: "Outros", kind: "saida_empresa", sortOrder: 13 },
  // Saídas — Pessoal
  { name: "Alimentação", kind: "saida_pessoal", sortOrder: 1 },
  { name: "Combustível pessoal", kind: "saida_pessoal", sortOrder: 2 },
  { name: "Casa", kind: "saida_pessoal", sortOrder: 3 },
  { name: "Cartão", kind: "saida_pessoal", sortOrder: 4 },
  { name: "Lazer", kind: "saida_pessoal", sortOrder: 5 },
  { name: "Roupas", kind: "saida_pessoal", sortOrder: 6 },
  { name: "Viagem", kind: "saida_pessoal", sortOrder: 7 },
  { name: "Empréstimo", kind: "saida_pessoal", sortOrder: 8 },
  { name: "Outros", kind: "saida_pessoal", sortOrder: 9 },
];

export const FINANCIAL_METHODS = ["dinheiro", "pix", "debito", "credito", "crediarista", "transferencia", "outro"] as const;
export type FinancialMethod = (typeof FINANCIAL_METHODS)[number];
export const FINANCIAL_METHOD_LABELS: Record<FinancialMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  debito: "Débito",
  credito: "Crédito",
  crediarista: "Crediarista",
  transferencia: "Transferência",
  outro: "Outro",
};

export const FINANCIAL_ACCOUNT_TYPES = ["caixa", "banco", "pix", "pessoal", "empresa", "reserva", "outro"] as const;
export type FinancialAccountType = (typeof FINANCIAL_ACCOUNT_TYPES)[number];
export const FINANCIAL_ACCOUNT_TYPE_LABELS: Record<FinancialAccountType, string> = {
  caixa: "Caixa físico",
  banco: "Banco",
  pix: "Pix",
  pessoal: "Conta pessoal",
  empresa: "Conta da empresa",
  reserva: "Dinheiro reservado",
  outro: "Outro",
};

/** Default carteiras seeded on first install. */
export const DEFAULT_FINANCIAL_ACCOUNTS: Array<{ name: string; type: FinancialAccountType }> = [
  { name: "Caixa da loja", type: "caixa" },
  { name: "Banco (empresa)", type: "banco" },
  { name: "Pix", type: "pix" },
];

export const LOAN_FREQUENCIES = ["diaria", "diaria_seg_sab", "semanal", "quinzenal", "mensal"] as const;
export type LoanFrequency = (typeof LOAN_FREQUENCIES)[number];
export const LOAN_FREQUENCY_LABELS: Record<LoanFrequency, string> = {
  diaria: "Diária",
  diaria_seg_sab: "Diária (segunda a sábado)",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

export const LOAN_STATUSES = ["ativo", "quitado"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];
