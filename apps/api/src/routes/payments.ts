import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { paymentFeeSchema, paymentMachineSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { paymentFees, paymentMachines } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const paymentsRouter = Router();

paymentsRouter.get(
  "/machines",
  asyncHandler(async (_req, res) => {
    const machines = await db.query.paymentMachines.findMany({
      with: { fees: { orderBy: (fees, { asc: ascFn }) => [ascFn(fees.method), ascFn(fees.installments)] } },
    });
    res.json(machines);
  })
);

paymentsRouter.post(
  "/machines",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = paymentMachineSchema.parse(req.body);
    const [created] = await db.insert(paymentMachines).values(data).returning();
    res.status(201).json(created);
  })
);

paymentsRouter.put(
  "/machines/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = paymentMachineSchema.partial().parse(req.body);
    const [updated] = await db
      .update(paymentMachines)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentMachines.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Máquina não encontrada");
    res.json(updated);
  })
);

paymentsRouter.delete(
  "/machines/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(paymentMachines).where(eq(paymentMachines.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Máquina não encontrada");
    res.status(204).send();
  })
);

// Fees are recalculated on-the-fly by every product read (see routes/products.ts),
// so editing a fee here automatically changes every product's displayed installments.
paymentsRouter.put(
  "/fees/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = paymentFeeSchema.partial().parse(req.body);
    const [updated] = await db
      .update(paymentFees)
      .set({
        ...data,
        feePercent: data.feePercent !== undefined ? data.feePercent.toString() : undefined,
      })
      .where(eq(paymentFees.id, req.params.id))
      .returning();
    if (!updated) throw new HttpError(404, "Taxa não encontrada");
    res.json(updated);
  })
);

paymentsRouter.post(
  "/fees",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = paymentFeeSchema.parse(req.body);
    const [created] = await db
      .insert(paymentFees)
      .values({ ...data, feePercent: data.feePercent.toString() })
      .returning();
    res.status(201).json(created);
  })
);
