import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES, DEFAULT_PAYMENT_MACHINES } from "@flashcell/shared";
import { env } from "../env.js";
import { db, pool } from "./client.js";
import { categories, paymentFees, paymentMachines, settings, users } from "./schema.js";
import { eq } from "drizzle-orm";

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
          .values({ name: machineDef.name, provider: machineDef.provider })
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
        })
        .onConflictDoNothing();
    }

    console.log(`Máquina "${machineDef.name}" pronta (${machineDef.fees.length} taxas).`);
  }

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
