import { Router } from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { paymentSimulationSchema, simulationQuerySchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { paymentSimulations } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const simulationsRouter = Router();

simulationsRouter.use(requireAuth, requireRole("admin"));

simulationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = simulationQuerySchema.parse(req.query);
    const conditions = [];

    if (query.machineId) conditions.push(eq(paymentSimulations.machineId, query.machineId));
    if (query.method) conditions.push(eq(paymentSimulations.method, query.method));
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(or(ilike(paymentSimulations.machineName, term), ilike(paymentSimulations.method, term))!);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (query.page - 1) * query.pageSize;

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(paymentSimulations)
        .where(where)
        .orderBy(desc(paymentSimulations.createdAt))
        .limit(query.pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(paymentSimulations).where(where),
    ]);

    res.json({ items: rows, total: count, page: query.page, pageSize: query.pageSize });
  })
);

simulationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = paymentSimulationSchema.parse(req.body);
    const [created] = await db
      .insert(paymentSimulations)
      .values({
        machineId: data.machineId ?? null,
        machineName: data.machineName,
        method: data.method,
        installments: data.installments,
        mode: data.mode,
        inputAmount: data.inputAmount.toString(),
        chargeAmount: data.chargeAmount.toString(),
        netAmount: data.netAmount.toString(),
        feeAmount: data.feeAmount.toString(),
        feePercent: data.feePercent.toString(),
      })
      .returning();
    res.status(201).json(created);
  })
);

simulationsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(paymentSimulations).where(eq(paymentSimulations.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Simulação não encontrada");
    res.status(204).send();
  })
);
