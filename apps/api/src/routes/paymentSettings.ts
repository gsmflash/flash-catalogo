import { Router } from "express";
import { eq } from "drizzle-orm";
import { paymentSettingsSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { paymentSettings } from "../db/schema.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { testMpConnection } from "../lib/mercadopago.js";
import { env } from "../env.js";

export const paymentSettingsRouter = Router();

const DEFAULT_ROW = {
  id: "default",
  mpPublicKey: null as string | null,
  mpMode: "sandbox" as const,
  mpActive: false,
  pixName: null as string | null,
  pixBank: null as string | null,
  pixKey: null as string | null,
  pixKeyType: null as string | null,
  pixQrCodeUrl: null as string | null,
};

/** Só o necessário pro checkout público: nunca inclui tokens/segredos. */
paymentSettingsRouter.get(
  "/public",
  asyncHandler(async (_req, res) => {
    const [row] = await db.select().from(paymentSettings).where(eq(paymentSettings.id, "default")).limit(1);
    res.json({
      mpPublicKey: row?.mpPublicKey || env.MERCADOPAGO_PUBLIC_KEY || null,
      mpActive: row?.mpActive ?? false,
      mpMode: row?.mpMode ?? "sandbox",
      pixName: row?.pixName ?? null,
      pixBank: row?.pixBank ?? null,
      pixKey: row?.pixKey ?? null,
      pixKeyType: row?.pixKeyType ?? null,
      pixQrCodeUrl: row?.pixQrCodeUrl ?? null,
    });
  })
);

paymentSettingsRouter.use(requireAuth, requireRole("admin"));

paymentSettingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [row] = await db.select().from(paymentSettings).where(eq(paymentSettings.id, "default")).limit(1);
    const source = row ?? DEFAULT_ROW;
    // Access token e webhook secret nunca voltam pra fora — só um indicador.
    res.json({
      ...source,
      mpAccessToken: undefined,
      mpWebhookSecret: undefined,
      mpAccessTokenConfigured: !!(row?.mpAccessToken || env.MERCADOPAGO_ACCESS_TOKEN),
      mpWebhookSecretConfigured: !!(row?.mpWebhookSecret || env.MERCADOPAGO_WEBHOOK_SECRET),
      webhookUrl: env.API_PUBLIC_URL ? `${env.API_PUBLIC_URL}/api/mercadopago/webhook` : null,
    });
  })
);

paymentSettingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const data = paymentSettingsSchema.partial().parse(req.body);

    // Campos "escreve mas nunca lê de volta": só entram no SET se vieram
    // explicitamente no body (string não-vazia). Deixar de fora preserva o
    // valor atual — evita apagar o token só porque o form não reenviou.
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (data.mpAccessToken !== undefined) set.mpAccessToken = data.mpAccessToken || null;
    if (data.mpPublicKey !== undefined) set.mpPublicKey = data.mpPublicKey || null;
    if (data.mpWebhookSecret !== undefined) set.mpWebhookSecret = data.mpWebhookSecret || null;
    if (data.mpMode !== undefined) set.mpMode = data.mpMode;
    if (data.mpActive !== undefined) set.mpActive = data.mpActive;
    if (data.pixName !== undefined) set.pixName = data.pixName;
    if (data.pixBank !== undefined) set.pixBank = data.pixBank;
    if (data.pixKey !== undefined) set.pixKey = data.pixKey;
    if (data.pixKeyType !== undefined) set.pixKeyType = data.pixKeyType;
    if (data.pixQrCodeUrl !== undefined) set.pixQrCodeUrl = data.pixQrCodeUrl;

    const [updated] = await db
      .insert(paymentSettings)
      .values({ id: "default", ...set } as typeof paymentSettings.$inferInsert)
      .onConflictDoUpdate({ target: paymentSettings.id, set })
      .returning();

    res.json({
      ...updated,
      mpAccessToken: undefined,
      mpWebhookSecret: undefined,
      mpAccessTokenConfigured: !!updated.mpAccessToken,
      mpWebhookSecretConfigured: !!updated.mpWebhookSecret,
    });
  })
);

paymentSettingsRouter.post(
  "/test-connection",
  asyncHandler(async (_req, res) => {
    const result = await testMpConnection();
    res.json(result);
  })
);
