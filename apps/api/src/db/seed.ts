import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES, DEFAULT_FINANCIAL_ACCOUNTS, DEFAULT_FINANCIAL_CATEGORIES, DEFAULT_PAYMENT_MACHINES } from "@flashcell/shared";
import { env } from "../env.js";
import { db, pool } from "./client.js";
import { categories, financialAccounts, financialCategories, paymentFees, paymentMachines, settings, users } from "./schema.js";
import { and, eq } from "drizzle-orm";

async function main() {
  console.log("Seedando banco de dados...");

  for (const cat of DEFAULT_CATEGORIES) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoNothing({ target: categories.slug });
  }

  for (const machineDef of DEFAULT_PAYMENT_MACHINES) {
    const [machine] = await db
      .select()
      .from(paymentMachines)
      .where(eq(paymentMachines.name, machineDef.name))
      .limit(1);

    const machineId =
      machine?.id ??
      (
        await db
          .insert(paymentMachines)
          .values({
            name: machineDef.name,
            provider: machineDef.provider,
            active: machineDef.active,
            maxInstallments: machineDef.maxInstallments,
            settlementType: machineDef.settlementType,
          })
          .returning()
      )[0].id;

    for (const fee of machineDef.fees) {
      await db
        .insert(paymentFees)
        .values({
          machineId,
          method: fee.method,
          installments: fee.installments,
          feePercent: fee.feePercent.toString(),
          monthlyRate: fee.monthlyRate != null ? fee.monthlyRate.toString() : null,
        })
        .onConflictDoNothing();
    }

    console.log(`Máquina "${machineDef.name}" pronta (${machineDef.fees.length} taxas).`);
  }

  for (const cat of DEFAULT_FINANCIAL_CATEGORIES) {
    const [existing] = await db
      .select()
      .from(financialCategories)
      .where(and(eq(financialCategories.name, cat.name), eq(financialCategories.kind, cat.kind)))
      .limit(1);
    if (!existing) await db.insert(financialCategories).values(cat);
  }
  console.log(`Categorias financeiras prontas (${DEFAULT_FINANCIAL_CATEGORIES.length}).`);

  for (const acc of DEFAULT_FINANCIAL_ACCOUNTS) {
    const [existing] = await db
      .select()
      .from(financialAccounts)
      .where(and(eq(financialAccounts.name, acc.name), eq(financialAccounts.type, acc.type)))
      .limit(1);
    if (!existing) await db.insert(financialAccounts).values(acc);
  }
  console.log(`Carteiras financeiras prontas (${DEFAULT_FINANCIAL_ACCOUNTS.length}).`);

  await db
    .insert(settings)
    .values({
      id: "default",
      storeName: "Flash Cell",
      whatsapp: "",
      primaryColor: "#0ea5e9",
    })
    .onConflictDoNothing({ target: settings.id });

  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, env.SEED_ADMIN_EMAIL))
    .limit(1);

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);
    await db.insert(users).values({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    });
    console.log(`Usuário admin criado: ${env.SEED_ADMIN_EMAIL}`);
  } else {
    console.log("Usuário admin já existe, pulando.");
  }

  console.log("Seed concluído.");
  await pool.end();
}

main().catch((err) => {
  console.error("Falha ao seedar banco:", err);
  process.exit(1);
});
