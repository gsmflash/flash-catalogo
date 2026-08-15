import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { orderChargeSchema, orderCreateSchema, orderQuerySchema, orderStatusUpdateSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { orders, products } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { getMpPaymentClient } from "../lib/mercadopago.js";
import { mapMpStatus } from "../lib/orderStatus.js";

export const ordersRouter = Router();

function generateOrderNumber(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** Cria o pedido (Pix pendente, ou o registro-base antes de cobrar no cartão). */
ordersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = orderCreateSchema.parse(req.body);

    const product = await db.query.products.findFirst({
      where: eq(products.id, data.productId),
      with: { images: { limit: 1, orderBy: (img, { asc: ascFn }) => [ascFn(img.sortOrder)] } },
    });
    if (!product) throw new HttpError(404, "Produto não encontrado");

    const amount = Number(product.price) * data.quantity;

    const [created] = await db
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        productId: product.id,
        productSnapshot: {
          brand: product.brand,
          model: product.model,
          color: product.color,
          storage: product.storage,
          unitPrice: product.price,
          imageUrl: product.images?.[0]?.url ?? null,
        },
        quantity: data.quantity,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        amount: amount.toString(),
        method: data.method,
        status: "pendente",
      })
      .returning();

    res.status(201).json(created);
  })
);

/** Cobra no cartão usando o token gerado pelo Payment Brick no navegador. */
ordersRouter.post(
  "/:id/charge",
  asyncHandler(async (req, res) => {
    const data = orderChargeSchema.parse(req.body);
    const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);
    if (!order) throw new HttpError(404, "Pedido não encontrado");
    if (order.method !== "cartao") throw new HttpError(400, "Este pedido não é de cartão");
    if (order.status === "pago") {
      res.json(order); // idempotente — já processado
      return;
    }

    const paymentClient = await getMpPaymentClient();
    if (!paymentClient) throw new HttpError(503, "Mercado Pago não está configurado");

    const snapshot = order.productSnapshot as { brand: string; model: string };

    try {
      const result = await paymentClient.create({
        body: {
          transaction_amount: Number(order.amount),
          token: data.token,
          description: `${snapshot.brand} ${snapshot.model}`.trim() || `Pedido ${order.orderNumber}`,
          installments: data.installments,
          payment_method_id: data.paymentMethodId,
          issuer_id: data.issuerId ? Number(data.issuerId) : undefined,
          external_reference: order.id,
          payer: {
            email: data.payerEmail,
            identification:
              data.payerIdentificationType && data.payerIdentificationNumber
                ? { type: data.payerIdentificationType, number: data.payerIdentificationNumber }
                : undefined,
          },
        },
      });

      const [updated] = await db
        .update(orders)
        .set({
          status: mapMpStatus(result.status),
          installments: data.installments,
          mpPaymentId: result.id ? String(result.id) : null,
          mpStatusDetail: result.status_detail ?? null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("Erro ao processar pagamento Mercado Pago:", err);
      await db
        .update(orders)
        .set({ status: "cancelado", mpStatusDetail: "processing_error", updatedAt: new Date() })
        .where(eq(orders.id, order.id));
      throw new HttpError(502, "Não foi possível processar o pagamento. Verifique os dados do cartão e tente novamente.");
    }
  })
);

/** Consulta pública do status de um pedido (tela de confirmação). */
ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, req.params.id)).limit(1);
    if (!order) throw new HttpError(404, "Pedido não encontrado");
    res.json(order);
  })
);

ordersRouter.get(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const query = orderQuerySchema.parse(req.query);
    const conditions = [];
    if (query.status) conditions.push(eq(orders.status, query.status));
    if (query.method) conditions.push(eq(orders.method, query.method));
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(or(ilike(orders.customerName, term), ilike(orders.orderNumber, term))!);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (query.page - 1) * query.pageSize;

    const [items, [{ count }]] = await Promise.all([
      db.select().from(orders).where(where).orderBy(desc(orders.createdAt)).limit(query.pageSize).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(orders).where(where),
    ]);

    res.json({ items, total: count, page: query.page, pageSize: query.pageSize });
  })
);

ordersRouter.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = orderStatusUpdateSchema.parse(req.body);
    const [updated] = await db
      .update(orders)
      .set({ status: data.status, note: data.note ?? undefined, updatedAt: new Date() })
      .where(eq(orders.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Pedido não encontrado");
    res.json(updated);
  })
);
