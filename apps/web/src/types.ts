import type {
  FinancialAccountType,
  FinancialCategoryKind,
  FinancialMethod,
  FinancialScope,
  FinancialTransactionType,
  InstallmentOption,
  LoanFrequency,
  LoanStatus,
  PaymentMethod,
  ProductStatus,
} from "@flashcell/shared";

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  key: string;
  sortOrder: number;
  isMain: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  brand: string;
  model: string;
  color: string;
  storage: string;
  categoryId: string;
  price: string;
  pricePix: string;
  description: string;
  specifications: Record<string, string>;
  status: ProductStatus;
  machineId: string;
  images: ProductImage[];
  pricing: InstallmentOption[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  related: Product[];
}

/** Shape returned by the admin-only /products/admin listing (no computed pricing). */
export type AdminProduct = Omit<Product, "pricing">;

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsapp: string;
  instagram: string | null;
  facebook: string | null;
  address: string | null;
  primaryColor: string;
}

export interface PaymentMachine {
  id: string;
  name: string;
  provider: string;
  active: boolean;
  maxInstallments: number | null;
  settlementType: string | null;
  fees: Array<{ id: string; method: PaymentMethod; installments: number; feePercent: string; monthlyRate: string | null }>;
}

export interface PaymentSimulation {
  id: string;
  machineId: string | null;
  machineName: string;
  method: PaymentMethod;
  installments: number;
  mode: "charge" | "net";
  inputAmount: string;
  chargeAmount: string;
  netAmount: string;
  feeAmount: string;
  feePercent: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Financeiro
// ---------------------------------------------------------------------------

export interface FinancialAccount {
  id: string;
  name: string;
  type: FinancialAccountType;
  active: boolean;
  createdAt: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  kind: FinancialCategoryKind;
  sortOrder: number;
  active: boolean;
}

export type TransactionStatus = "pago" | "pendente" | "vencendo_hoje" | "vencido";

export interface FinancialTransaction {
  id: string;
  type: FinancialTransactionType;
  scope: FinancialScope;
  description: string;
  amount: string;
  grossAmount: string | null;
  feePercent: string | null;
  categoryId: string | null;
  category: FinancialCategory | null;
  date: string;
  dueDate: string | null;
  paid: boolean;
  method: FinancialMethod | null;
  accountId: string | null;
  account: FinancialAccount | null;
  clientName: string | null;
  productId: string | null;
  product: { brand: string; model: string } | null;
  costAmount: string | null;
  note: string | null;
  recurring: boolean;
  recurrenceDay: number | null;
  isFinancing: boolean;
  reserveId: string | null;
  reserveDirection: "deposito" | "retirada" | null;
  loanId: string | null;
  installmentNumber: number | null;
  createdAt: string;
  /** Só presente quando a listagem inclui pendências (dashboard/vencimentos). */
  status?: TransactionStatus;
}

export interface FinancialTransactionListResponse {
  items: FinancialTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FinancialReserve {
  id: string;
  name: string;
  goalAmount: string;
  deadline: string | null;
  note: string | null;
  currentAmount: number;
  percent: number;
  remaining: number;
  createdAt: string;
}

export interface FinancialLoan {
  id: string;
  description: string;
  principalAmount: string;
  receivedDate: string;
  installmentsCount: number;
  installmentAmount: string;
  frequency: LoanFrequency;
  firstDueDate: string;
  totalToPay: string;
  interestAmount: string | null;
  status: LoanStatus;
  accountId: string | null;
  createdAt: string;
  totalPaid: number;
  totalRemaining: number;
  installmentsPaid: number;
  installmentsRemaining: number;
  nextDueDate: string | null;
}

export interface FinancialLoanDetail extends FinancialLoan {
  installments: FinancialTransaction[];
}

export interface FinancialBudget {
  id: string;
  categoryId: string;
  limitAmount: string;
  categoryName: string;
  categoryKind: FinancialCategoryKind;
  spentAmount: number;
}

export interface FinancialSettingsData {
  id: string;
  dailyPersonalLimit: string | null;
}

export interface FinancialDashboardSummary {
  saldoAtual: number;
  entradasMes: number;
  saidasMes: number;
  lucroLiquidoMes: number;
  contasAPagar: number;
  contasAReceber: number;
  valorReservado: number;
  resultadoProjetadoMes: number;
  upcoming: FinancialTransaction[];
  chart: Array<{ date: string; entradas: number; saidas: number }>;
  insights: string[];
}

export interface FinancialProjectionDay {
  date: string;
  entradas: number;
  saidas: number;
  items: Array<{ description: string; amount: number; type: FinancialTransactionType }>;
  saldoAcumulado: number;
}

export interface FinancialProjection {
  saldoAtual: number;
  saldoProjetado: number;
  totalEntradasPrevistas: number;
  totalSaidasPrevistas: number;
  willGoNegative: boolean;
  negativeDate: string | null;
  days: FinancialProjectionDay[];
}

export interface FinancialMonthReportData {
  entradas: number;
  saidas: number;
  lucroLiquido: number;
  gastosEmpresa: number;
  gastosPessoal: number;
  comprasEstoque: number;
  gastosAlimentacao: number;
  combustivel: number;
  emprestimos: number;
  contasPagas: number;
  contasPendentes: number;
  valoresAReceber: number;
  valorInvestidoEmEstoque: number;
}

export interface FinancialMonthReport {
  month: string;
  current: FinancialMonthReportData;
  previous: FinancialMonthReportData;
}
