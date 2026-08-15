CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"product_id" uuid,
	"product_snapshot" jsonb NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"method" text NOT NULL,
	"installments" integer,
	"status" text DEFAULT 'pendente' NOT NULL,
	"mp_payment_id" text,
	"mp_status_detail" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"mp_access_token" text,
	"mp_public_key" text,
	"mp_mode" text DEFAULT 'sandbox' NOT NULL,
	"mp_active" boolean DEFAULT false NOT NULL,
	"pix_name" text,
	"pix_bank" text,
	"pix_key" text,
	"pix_key_type" text,
	"pix_qr_code_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "orders_mp_payment_id_idx" ON "orders" USING btree ("mp_payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders" USING btree ("created_at");