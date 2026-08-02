import { Router } from "express";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { loginSchema } from "@flashcell/shared";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { comparePassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { asyncHandler, HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

authRouter.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) throw new HttpError(401, "E-mail ou senha inválidos");

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw new HttpError(401, "E-mail ou senha inválidos");

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.sub)).limit(1);
    if (!user) throw new HttpError(404, "Usuário não encontrado");
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  })
);
