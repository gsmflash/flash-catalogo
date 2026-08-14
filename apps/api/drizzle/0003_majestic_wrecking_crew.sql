CREATE TABLE IF NOT EXISTS "financial_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"limit_amount" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"principal_amount" numeric(12, 2) NOT NULL,
	"received_date" timestamp with time zone NOT NULL,
	"installments_count" integer NOT NULL,
	"installment_amount" numeric(12, 2) NOT NULL,
	"frequency" text NOT NULL,
	"first_due_date" timestamp with time zone NOT NULL,
	"total_to_pay" numeric(12, 2) NOT NULL,
	"interest_amount" numeric(12, 2),
	"status" text DEFAULT 'ativo' NOT NULL,
	"account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_reserves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"goal_amount" numeric(12, 2) NOT NULL,
	"deadline" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"daily_personal_limit" numeric(12, 2),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"scope" text DEFAULT 'empresa' NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"gross_amount" numeric(12, 2),
	"fee_percent" numeric(5, 2),
	"category_id" uuid NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone,
	"paid" boolean DEFAULT true NOT NULL,
	"method" text,
	"account_id" uuid,
	"client_name" text,
	"product_id" uuid,
	"cost_amount" numeric(12, 2),
	"note" text,
	"recurring" boolean DEFAULT false NOT NULL,
	"recurrence_day" integer,
	"is_financing" boolean DEFAULT false NOT NULL,
	"reserve_id" uuid,
	"reserve_direction" text,
	"loan_id" uuid,
	"installment_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_budgets" ADD CONSTRAINT "financial_budgets_category_id_financial_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."financial_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_loans" ADD CONSTRAINT "financial_loans_account_id_financial_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_category_id_financial_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."financial_categories"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_account_id_financial_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_reserve_id_financial_reserves_id_fk" FOREIGN KEY ("reserve_id") REFERENCES "public"."financial_reserves"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_loan_id_financial_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."financial_loans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "financial_budgets_category_unique" ON "financial_budgets" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_transactions_date_idx" ON "financial_transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_transactions_due_date_idx" ON "financial_transactions" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_transactions_type_idx" ON "financial_transactions" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_transactions_category_idx" ON "financial_transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_transactions_loan_idx" ON "financial_transactions" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_transactions_reserve_idx" ON "financial_transactions" USING btree ("reserve_id");