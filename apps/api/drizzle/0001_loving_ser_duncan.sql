CREATE TABLE IF NOT EXISTS "payment_simulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"machine_id" uuid,
	"machine_name" text NOT NULL,
	"method" text NOT NULL,
	"installments" integer NOT NULL,
	"mode" text NOT NULL,
	"input_amount" numeric(10, 2) NOT NULL,
	"charge_amount" numeric(10, 2) NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"fee_amount" numeric(10, 2) NOT NULL,
	"fee_percent" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_machines" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_machines" ADD COLUMN "max_installments" integer;--> statement-breakpoint
ALTER TABLE "payment_machines" ADD COLUMN "settlement_type" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_simulations" ADD CONSTRAINT "payment_simulations_machine_id_payment_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."payment_machines"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_simulations_created_at_idx" ON "payment_simulations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_simulations_machine_idx" ON "payment_simulations" USING btree ("machine_id");