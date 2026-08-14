import { Router } from "express";
import { eq } from "drizzle-orm";
import { financialSettingsSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { financialSettings } from "../db/schema.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const financialSettingsRouter = Router();
financialSettingsRouter.use(requireAuth, requireRole("admin"));

financialSettingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [current] = await db.select().from(financialSettings).where(eq(financialSettings.id, "default")).limit(1);
    res.json(current ?? { id: "default", dailyPersonalLimit: null });
  })
);

financialSettingsRouter.put(
  "/",
  asyncHandler(async (req, res) => {
    const data = financialSettingsSchema.partial().parse(req.body);
    const [updated] = await db
      .insert(financialSettings)
      .values({ id: "default", dailyPersonalLimit: data.dailyPersonalLimit?.toString() })
      .onConflictDoUpdate({
        target: financialSettings.id,
        set: { dailyPersonalLimit: data.dailyPersonalLimit?.toString(), updatedAt: new Date() },
      })
      .returning();
    res.json(updated);
  })
);
