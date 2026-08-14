import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("editor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentMachines = pgTable("payment_machines", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  active: boolean("active").notNull().default(true),
  maxInstallments: integer("max_installments"),
  settlementType: text("settlement_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentFees = pgTable(
  "payment_fees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    machineId: uuid("machine_id")
      .notNull()
      .references(() => paymentMachines.id, { onDelete: "cascade" }),
    method: text("method").notNull(),
    installments: integer("installments").notNull(),
    feePercent: numeric("fee_percent", { precision: 5, scale: 2 }).notNull(),
    monthlyRate: numeric("monthly_rate", { precision: 5, scale: 2 }),
  },
  (table) => ({
    uniqueFee: uniqueIndex("payment_fees_unique").on(table.machineId, table.method, table.installments),
  })
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    color: text("color").notNull(),
    storage: text("storage").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    pricePix: numeric("price_pix", { precision: 10, scale: 2 }).notNull(),
    description: text("description").notNull().default(""),
    specifications: jsonb("specifications").notNull().default({}),
    status: text("status").notNull().default("disponivel"),
    machineId: uuid("machine_id")
      .notNull()
      .references(() => paymentMachines.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    brandIdx: index("products_brand_idx").on(table.brand),
    statusIdx: index("products_status_idx").on(table.status),
    categoryIdx: index("products_category_idx").on(table.categoryId),
  })
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    key: text("key").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isMain: boolean("is_main").notNull().default(false),
  },
  (table) => ({
    productIdx: index("product_images_product_idx").on(table.productId),
  })
);

export const paymentSimulations = pgTable(
  "payment_simulations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    machineId: uuid("machine_id").references(() => paymentMachines.id, { onDelete: "set null" }),
    machineName: text("machine_name").notNull(),
    method: text("method").notNull(),
    installments: integer("installments").notNull(),
    mode: text("mode").notNull(),
    inputAmount: numeric("input_amount", { precision: 10, scale: 2 }).notNull(),
    chargeAmount: numeric("charge_amount", { precision: 10, scale: 2 }).notNull(),
    netAmount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(),
    feeAmount: numeric("fee_amount", { precision: 10, scale: 2 }).notNull(),
    feePercent: numeric("fee_percent", { precision: 5, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    createdAtIdx: index("payment_simulations_created_at_idx").on(table.createdAt),
    machineIdx: index("payment_simulations_machine_idx").on(table.machineId),
  })
);

export const paymentSimulationsRelations = relations(paymentSimulations, ({ one }) => ({
  machine: one(paymentMachines, { fields: [paymentSimulations.machineId], references: [paymentMachines.id] }),
}));

// ---------------------------------------------------------------------------
// Financeiro / Fluxo de Caixa
// ---------------------------------------------------------------------------

/** "Carteiras": caixa físico, banco, Pix, conta pessoal, conta da empresa... */
export const financialAccounts = pgTable("financial_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Categorias de entrada/saída-empresa/saída-pessoal, seedadas e editáveis. */
export const financialCategories = pgTable("financial_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  kind: text("kind").notNull(), // "entrada" | "saida_empresa" | "saida_pessoal"
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

/** Metas/reservas (inclui a viagem, que é só uma reserva com categorias próprias). */
export const financialReserves = pgTable("financial_reserves", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  goalAmount: numeric("goal_amount", { precision: 12, scale: 2 }).notNull(),
  deadline: timestamp("deadline", { withTimezone: true }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Cabeçalho do empréstimo — as parcelas são linhas de financial_transactions (loanId). */
export const financialLoans = pgTable("financial_loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description").notNull(),
  principalAmount: numeric("principal_amount", { precision: 12, scale: 2 }).notNull(),
  receivedDate: timestamp("received_date", { withTimezone: true }).notNull(),
  installmentsCount: integer("installments_count").notNull(),
  installmentAmount: numeric("installment_amount", { precision: 12, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(), // "diaria_seg_sab" | "diaria" | "semanal" | "quinzenal" | "mensal"
  firstDueDate: timestamp("first_due_date", { withTimezone: true }).notNull(),
  totalToPay: numeric("total_to_pay", { precision: 12, scale: 2 }).notNull(),
  interestAmount: numeric("interest_amount", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("ativo"), // "ativo" | "quitado"
  accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Limite diário de gastos pessoais — mesmo padrão de linha única da tabela `settings`. */
export const financialSettings = pgTable("financial_settings", {
  id: text("id").primaryKey().default("default"),
  dailyPersonalLimit: numeric("daily_personal_limit", { precision: 12, scale: 2 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Limite mensal de orçamento por categoria. */
export const financialBudgets = pgTable(
  "financial_budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => financialCategories.id, { onDelete: "cascade" }),
    limitAmount: numeric("limit_amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: uniqueIndex("financial_budgets_category_unique").on(table.categoryId),
  })
);

/**
 * The core ledger: entradas, saídas, contas a pagar (saída + dueDate + !paid),
 * contas a receber (entrada + dueDate + !paid), parcelas de empréstimo (loanId set)
 * and transferências entre contas/reservas are all rows here — one entity, filtered
 * differently per screen, instead of near-duplicate tables per section of the module.
 */
export const financialTransactions = pgTable(
  "financial_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(), // "entrada" | "saida" | "transferencia"
    scope: text("scope").notNull().default("empresa"), // "empresa" | "pessoal" (saídas)
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    /** Valor bruto antes da taxa (contas a receber com desconto de taxa). */
    grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }),
    feePercent: numeric("fee_percent", { precision: 5, scale: 2 }),
    /** Nulo apenas para transferências (não têm categoria). */
    categoryId: uuid("category_id").references(() => financialCategories.id, { onDelete: "restrict" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    paid: boolean("paid").notNull().default(true),
    method: text("method"), // dinheiro | pix | debito | credito | crediarista | transferencia | outro
    accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: "set null" }),
    clientName: text("client_name"),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    /** Custo do produto vendido (digitado manualmente — o catálogo não tem custo cadastrado). */
    costAmount: numeric("cost_amount", { precision: 12, scale: 2 }),
    note: text("note"),
    recurring: boolean("recurring").notNull().default(false),
    recurrenceDay: integer("recurrence_day"),
    /** true apenas para a entrada do principal de um empréstimo — não conta como lucro. */
    isFinancing: boolean("is_financing").notNull().default(false),
    reserveId: uuid("reserve_id").references(() => financialReserves.id, { onDelete: "set null" }),
    /** Para transferências: "deposito" soma na reserva, "retirada" subtrai. */
    reserveDirection: text("reserve_direction"),
    loanId: uuid("loan_id").references(() => financialLoans.id, { onDelete: "set null" }),
    installmentNumber: integer("installment_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    dateIdx: index("financial_transactions_date_idx").on(table.date),
    dueDateIdx: index("financial_transactions_due_date_idx").on(table.dueDate),
    typeIdx: index("financial_transactions_type_idx").on(table.type),
    categoryIdx: index("financial_transactions_category_idx").on(table.categoryId),
    loanIdx: index("financial_transactions_loan_idx").on(table.loanId),
    reserveIdx: index("financial_transactions_reserve_idx").on(table.reserveId),
  })
);

export const financialAccountsRelations = relations(financialAccounts, ({ many }) => ({
  transactions: many(financialTransactions),
}));

export const financialCategoriesRelations = relations(financialCategories, ({ many }) => ({
  transactions: many(financialTransactions),
}));

export const financialReservesRelations = relations(financialReserves, ({ many }) => ({
  transactions: many(financialTransactions),
}));

export const financialLoansRelations = relations(financialLoans, ({ many }) => ({
  installments: many(financialTransactions),
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  category: one(financialCategories, { fields: [financialTransactions.categoryId], references: [financialCategories.id] }),
  account: one(financialAccounts, { fields: [financialTransactions.accountId], references: [financialAccounts.id] }),
  product: one(products, { fields: [financialTransactions.productId], references: [products.id] }),
  reserve: one(financialReserves, { fields: [financialTransactions.reserveId], references: [financialReserves.id] }),
  loan: one(financialLoans, { fields: [financialTransactions.loanId], references: [financialLoans.id] }),
}));

export const settings = pgTable("settings", {
  id: text("id").primaryKey().default("default"),
  storeName: text("store_name").notNull().default("Flash Cell"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  whatsapp: text("whatsapp").notNull().default(""),
  instagram: text("instagram"),
  facebook: text("facebook"),
  address: text("address"),
  primaryColor: text("primary_color").notNull().default("#0ea5e9"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentMachinesRelations = relations(paymentMachines, ({ many }) => ({
  fees: many(paymentFees),
  products: many(products),
}));

export const paymentFeesRelations = relations(paymentFees, ({ one }) => ({
  machine: one(paymentMachines, { fields: [paymentFees.machineId], references: [paymentMachines.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  machine: one(paymentMachines, { fields: [products.machineId], references: [paymentMachines.id] }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));
