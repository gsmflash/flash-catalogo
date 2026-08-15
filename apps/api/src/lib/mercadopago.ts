import { MercadoPagoConfig, Payment, WebhookSignatureValidator } from "mercadopago";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { paymentSettings } from "../db/schema.js";
import { env } from "../env.js";

export interface MpCredentials {
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  mode: "sandbox" | "production";
  active: boolean;
}

/**
 * Credenciais vêm do banco (editável pelo painel) com fallback para as
 * variáveis de ambiente — nunca expostas ao frontend além da publicKey,
 * que é feita pra ser pública (usada pelo Payment Brick no navegador).
 */
export async function getMpSettingsRow() {
  const [row] = await db.select().from(paymentSettings).where(eq(paymentSettings.id, "default")).limit(1);
  return row ?? null;
}

export async function getMpCredentials(): Promise<MpCredentials | null> {
  const row = await getMpSettingsRow();
  const accessToken = row?.mpAccessToken || env.MERCADOPAGO_ACCESS_TOKEN;
  const publicKey = row?.mpPublicKey || env.MERCADOPAGO_PUBLIC_KEY;
  const webhookSecret = row?.mpWebhookSecret || env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!accessToken) return null;

  return {
    accessToken,
    publicKey,
    webhookSecret,
    mode: (row?.mpMode as "sandbox" | "production") ?? "sandbox",
    active: row?.mpActive ?? false,
  };
}

export async function getMpPaymentClient(): Promise<Payment | null> {
  const creds = await getMpCredentials();
  if (!creds) return null;
  const config = new MercadoPagoConfig({ accessToken: creds.accessToken });
  return new Payment(config);
}

/** Chamada leve e somente-leitura pra confirmar que o Access Token é válido. */
export async function testMpConnection(): Promise<{ ok: boolean; message: string }> {
  const creds = await getMpCredentials();
  if (!creds) return { ok: false, message: "Access Token não configurado" };

  try {
    const config = new MercadoPagoConfig({ accessToken: creds.accessToken });
    const payment = new Payment(config);
    await payment.search({ options: { limit: 1 } });
    return { ok: true, message: `Conexão bem-sucedida (modo ${creds.mode})` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha na conexão com o Mercado Pago";
    return { ok: false, message };
  }
}

export interface WebhookVerifyInput {
  xSignature: string | string[] | undefined | null;
  xRequestId: string | string[] | undefined | null;
  dataId: string | string[] | undefined | null;
}

/** Valida a assinatura HMAC do webhook (evita requisições forjadas). */
export async function verifyMpWebhookSignature(input: WebhookVerifyInput): Promise<boolean> {
  const creds = await getMpCredentials();
  if (!creds?.webhookSecret) return false;

  try {
    WebhookSignatureValidator.validate({
      ...input,
      secret: creds.webhookSecret,
      toleranceSeconds: 300,
    });
    return true;
  } catch {
    return false;
  }
}
