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
