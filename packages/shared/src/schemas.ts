import { z } from "zod";
import {
  FINANCIAL_ACCOUNT_TYPES,
  FINANCIAL_CATEGORY_KINDS,
  FINANCIAL_METHODS,
  FINANCIAL_SCOPES,
  FINANCIAL_TRANSACTION_TYPES,
  LOAN_FREQUENCIES,
  LOAN_STATUSES,
  MAX_INSTALLMENTS,
  MIN_INSTALLMENTS,
  PAYMENT_METHODS,
  PRODUCT_STATUSES,
  USER_ROLES,
} from "./constants.js";

export const slugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números e hífens");

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(USER_ROLES),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string().min(8).max(72).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const categorySchema = z.object({
  name: z.string().min(1).max(80),
  slug: slugSchema,
  sortOrder: z.number().int().min(0).default(0),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const productImageSchema = z.object({
  url: z.string().url(),
  key: z.string().min(1),
  sortOrder: z.number().int().min(0),
  isMain: z.boolean().default(false),
});
export type ProductImageInput = z.infer<typeof productImageSchema>;

export const productSchema = z.object({
  brand: z.string().min(1).max(80),
  model: z.string().min(1).max(120),
  color: z.string().min(1).max(60),
  storage: z.string().min(1).max(40),
  categoryId: z.string().uuid(),
  price: z.number().positive(),
  pricePix: z.number().positive(),
  description: z.string().max(5000).default(""),
  specifications: z.record(z.string(), z.string()).default({}),
  status: z.enum(PRODUCT_STATUSES),
  machineId: z.string().uuid(),
  images: z.array(productImageSchema).default([]),
});
export type ProductInput = z.infer<typeof productSchema>;

export const paymentMachineSchema = z.object({
  name: z.string().min(1).max(80),
  provider: z.string().min(1).max(80),
  active: z.boolean().default(true),
  maxInstallments: z.number().int().min(MIN_INSTALLMENTS).max(MAX_INSTALLMENTS).nullable().optional(),
  settlementType: z.string().max(60).nullable().optional(),
});
export type PaymentMachineInput = z.infer<typeof paymentMachineSchema>;

export const paymentFeeSchema = z.object({
  machineId: z.string().uuid(),
  method: z.enum(PAYMENT_METHODS),
  installments: z.number().int().min(MIN_INSTALLMENTS).max(MAX_INSTALLMENTS),
  feePercent: z.number().min(0).max(100),
  /**
   * Optional monthly compounding rate (%) for acquirers whose installment fee
   * compounds over the plan's average settlement time instead of being a flat
   * percentage (e.g. PagBank). Null/omitted means a flat fee, as usual.
   */
  monthlyRate: z.number().min(0).max(100).nullable().optional(),
});
export type PaymentFeeInput = z.infer<typeof paymentFeeSchema>;

export const simulationModes = ["charge", "net"] as const;
export type SimulationMode = (typeof simulationModes)[number];

export const paymentSimulationSchema = z.object({
  machineId: z.string().uuid().nullable().optional(),
  machineName: z.string().min(1).max(80),
  method: z.enum(PAYMENT_METHODS),
  installments: z.number().int().min(MIN_INSTALLMENTS).max(MAX_INSTALLMENTS),
  mode: z.enum(simulationModes),
  inputAmount: z.number().positive(),
  chargeAmount: z.number().positive(),
  netAmount: z.number().positive(),
  feeAmount: z.number().min(0),
  feePercent: z.number().min(0).max(100),
});
export type PaymentSimulationInput = z.infer<typeof paymentSimulationSchema>;

export const settingsSchema = z.object({
  storeName: z.string().min(1).max(120),
  logoUrl: z.string().url().nullable().optional(),
  bannerUrl: z.string().url().nullable().optional(),
  whatsapp: z.string().min(8).max(20),
  instagram: z.string().max(255).nullable().optional(),
  facebook: z.string().max(255).nullable().optional(),
  address: z.string().max(255).nullable().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#0ea5e9"),
});
export type SettingsInput = z.infer<typeof settingsSchema>;

export const simulationQuerySchema = z.object({
  machineId: z.string().uuid().optional(),
  method: z.enum(PAYMENT_METHODS).optional(),
  q: z.string().max(160).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});
export type SimulationQueryInput = z.infer<typeof simulationQuerySchema>;

// ---------------------------------------------------------------------------
// Financeiro / Fluxo de Caixa
// ---------------------------------------------------------------------------

export const financialAccountSchema = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(FINANCIAL_ACCOUNT_TYPES),
  active: z.boolean().default(true),
});
export type FinancialAccountInput = z.infer<typeof financialAccountSchema>;

export const financialCategorySchema = z.object({
  name: z.string().min(1).max(80),
  kind: z.enum(FINANCIAL_CATEGORY_KINDS),
  sortOrder: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});
export type FinancialCategoryInput = z.infer<typeof financialCategorySchema>;

export const financialTransactionSchema = z
  .object({
    type: z.enum(FINANCIAL_TRANSACTION_TYPES),
    scope: z.enum(FINANCIAL_SCOPES).default("empresa"),
    description: z.string().min(1).max(200),
    amount: z.number().positive(),
    grossAmount: z.number().positive().nullable().optional(),
    feePercent: z.number().min(0).max(100).nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    date: z.coerce.date(),
    dueDate: z.coerce.date().nullable().optional(),
    paid: z.boolean().default(true),
    method: z.enum(FINANCIAL_METHODS).nullable().optional(),
    accountId: z.string().uuid().nullable().optional(),
    clientName: z.string().max(120).nullable().optional(),
    productId: z.string().uuid().nullable().optional(),
    costAmount: z.number().min(0).nullable().optional(),
    note: z.string().max(1000).nullable().optional(),
    recurring: z.boolean().default(false),
    recurrenceDay: z.number().int().min(1).max(31).nullable().optional(),
    reserveId: z.string().uuid().nullable().optional(),
    reserveDirection: z.enum(["deposito", "retirada"]).nullable().optional(),
  })
  .refine((data) => data.type !== "transferencia" || (data.reserveId && data.reserveDirection), {
    message: "Transferências precisam de reserva e direção (depósito/retirada)",
    path: ["reserveId"],
  })
  .refine((data) => data.type === "transferencia" || !!data.categoryId, {
    message: "Categoria é obrigatória para entradas e saídas",
    path: ["categoryId"],
  });
export type FinancialTransactionInput = z.infer<typeof financialTransactionSchema>;

export const financialTransactionQuerySchema = z.object({
  type: z.enum(FINANCIAL_TRANSACTION_TYPES).optional(),
  scope: z.enum(FINANCIAL_SCOPES).optional(),
  categoryId: z.string().uuid().optional(),
  paid: z.coerce.boolean().optional(),
  method: z.enum(FINANCIAL_METHODS).optional(),
  accountId: z.string().uuid().optional(),
  loanId: z.string().uuid().optional(),
  reserveId: z.string().uuid().optional(),
  hasDueDate: z.coerce.boolean().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  q: z.string().max(160).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type FinancialTransactionQueryInput = z.infer<typeof financialTransactionQuerySchema>;

export const financialReserveSchema = z.object({
  name: z.string().min(1).max(120),
  goalAmount: z.number().positive(),
  deadline: z.coerce.date().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});
export type FinancialReserveInput = z.infer<typeof financialReserveSchema>;

export const financialReserveTransferSchema = z.object({
  reserveId: z.string().uuid(),
  accountId: z.string().uuid().nullable().optional(),
  amount: z.number().positive(),
  direction: z.enum(["deposito", "retirada"]),
  date: z.coerce.date().default(() => new Date()),
  note: z.string().max(500).nullable().optional(),
});
export type FinancialReserveTransferInput = z.infer<typeof financialReserveTransferSchema>;

export const financialLoanSchema = z.object({
  description: z.string().min(1).max(160),
  scope: z.enum(FINANCIAL_SCOPES).default("empresa"),
  principalAmount: z.number().positive(),
  receivedDate: z.coerce.date(),
  installmentAmount: z.number().positive(),
  totalToPay: z.number().positive(),
  interestAmount: z.number().min(0).nullable().optional(),
  frequency: z.enum(LOAN_FREQUENCIES),
  firstDueDate: z.coerce.date(),
  accountId: z.string().uuid().nullable().optional(),
  status: z.enum(LOAN_STATUSES).default("ativo"),
});
export type FinancialLoanInput = z.infer<typeof financialLoanSchema>;

export const financialBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  limitAmount: z.number().positive(),
});
export type FinancialBudgetInput = z.infer<typeof financialBudgetSchema>;

export const financialSettingsSchema = z.object({
  dailyPersonalLimit: z.number().min(0).nullable().optional(),
});
export type FinancialSettingsInput = z.infer<typeof financialSettingsSchema>;

export const searchQuerySchema = z.object({
  q: z.string().max(160).optional(),
  category: z.string().max(80).optional(),
  brand: z.string().max(80).optional(),
  color: z.string().max(60).optional(),
  storage: z.string().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
});
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
