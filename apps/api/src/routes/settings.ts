import { Router } from "express";
import { eq } from "drizzle-orm";
import { settingsSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { settings } from "../db/schema.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const settingsRouter = Router();

settingsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const [current] = await db.select().from(settings).where(eq(settings.id, "default")).limit(1);
    res.json(
      current ?? {
        id: "default",
        storeName: "Flash Cell",
        logoUrl: null,
        bannerUrl: null,
        whatsapp: "",
        instagram: null,
        facebook: null,
        address: null,
        primaryColor: "#0ea5e9",
      }
    );
  })
);

settingsRouter.put(
  "/",
  requireAuth,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const data = settingsSchema.partial().parse(req.body);
    const [updated] = await db
      .insert(settings)
      .values({ id: "default", ...data } as typeof settings.$inferInsert)
      .onConflictDoUpdate({
        target: settings.id,
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    res.json(updated);
  })
);
