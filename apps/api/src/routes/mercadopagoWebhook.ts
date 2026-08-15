import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { orders } from "../db/schema.js";
import { getMpPaymentClient, verifyMpWebhookSignature } from "../lib/mercadopago.js";
import { mapMpStatus } from "../lib/orderStatus.js";

export const mercadopagoWebhookRouter = Router();

/**
 * Webhook público (o Mercado Pago não envia Bearer token) — a autenticidade
 * vem inteiramente da verificação de assinatura HMAC abaixo. Sempre responde
 * 200 pra evitar reenvios em loop; o processamento real só acontece se a
 * assinatura bater.
 */
mercadopagoWebhookRouter.post("/", async (req, res) => {
  try {
    const dataId = (req.query["data.id"] as string | undefined) ?? req.body?.data?.id;
    if (!dataId) {
      res.status(200).json({ received: true });
      return;
    }

    const validSignature = await verifyMpWebhookSignature({
      xSignature: req.headers["x-signature"],
      xRequestId: req.headers["x-request-id"],
      dataId,
    });

    if (!validSignature) {
      console.warn("Webhook Mercado Pago recebido com assinatura inválida — ignorado.");
      res.status(200).json({ received: true });
      return;
    }

    const paymentClient = await getMpPaymentClient();
    if (!paymentClient) {
      res.status(200).json({ received: true });
      return;
    }

    const payment = await paymentClient.get({ id: dataId });
    const orderId = payment.external_reference;

    if (orderId) {
      const status = mapMpStatus(payment.status);
      await db
        .update(orders)
        .set({
          status,
          mpPaymentId: payment.id ? String(payment.id) : dataId,
          mpStatusDetail: payment.status_detail ?? null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
      console.log(`Webhook Mercado Pago: pedido ${orderId} -> ${status}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Erro ao processar webhook Mercado Pago:", err);
    // 200 mesmo em erro interno — reenviar não vai resolver um bug do lado de cá,
    // só empilhar tentativas; o erro já foi logado para investigação manual.
    res.status(200).json({ received: true });
  }
});
