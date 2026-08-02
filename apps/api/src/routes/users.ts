import { Router } from "express";
import { eq } from "drizzle-orm";
import { createUserSchema, updateUserSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { hashPassword } from "../lib/password.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole("admin"));

function toPublicUser(u: typeof users.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const all = await db.select().from(users);
    res.json(all.map(toPublicUser));
  })
);

usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createUserSchema.parse(req.body);
    const passwordHash = await hashPassword(data.password);
    const [created] = await db
      .insert(users)
      .values({ name: data.name, email: data.email, passwordHash, role: data.role })
      .returning();
    res.status(201).json(toPublicUser(created));
  })
);

usersRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateUserSchema.parse(req.body);
    const updateValues: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (data.name) updateValues.name = data.name;
    if (data.email) updateValues.email = data.email;
    if (data.role) updateValues.role = data.role;
    if (data.password) updateValues.passwordHash = await hashPassword(data.password);

    const [updated] = await db.update(users).set(updateValues).where(eq(users.id, req.params.id)).returning();
    if (!updated) throw new HttpError(404, "Usuário não encontrado");
    res.json(toPublicUser(updated));
  })
);

usersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const [deleted] = await db.delete(users).where(eq(users.id, req.params.id)).returning();
    if (!deleted) throw new HttpError(404, "Usuário não encontrado");
    res.status(204).send();
  })
);
