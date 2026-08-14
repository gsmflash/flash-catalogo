import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./env.js";
import { authRouter } from "./routes/auth.js";
import { categoriesRouter } from "./routes/categories.js";
import { productsRouter } from "./routes/products.js";
import { paymentsRouter } from "./routes/payments.js";
import { simulationsRouter } from "./routes/simulations.js";
import { settingsRouter } from "./routes/settings.js";
import { usersRouter } from "./routes/users.js";
import { uploadRouter } from "./routes/upload.js";
import { financialAccountsRouter } from "./routes/financialAccounts.js";
import { financialCategoriesRouter } from "./routes/financialCategories.js";
import { financialTransactionsRouter } from "./routes/financialTransactions.js";
import { financialReservesRouter } from "./routes/financialReserves.js";
import { financialLoansRouter } from "./routes/financialLoans.js";
import { financialBudgetsRouter } from "./routes/financialBudgets.js";
import { financialSettingsRouter } from "./routes/financialSettings.js";
import { financialDashboardRouter } from "./routes/financialDashboard.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/simulations", simulationsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/users", usersRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/financial/accounts", financialAccountsRouter);
app.use("/api/financial/categories", financialCategoriesRouter);
app.use("/api/financial/transactions", financialTransactionsRouter);
app.use("/api/financial/reserves", financialReservesRouter);
app.use("/api/financial/loans", financialLoansRouter);
app.use("/api/financial/budgets", financialBudgetsRouter);
app.use("/api/financial/settings", financialSettingsRouter);
app.use("/api/financial/dashboard", financialDashboardRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Flash Cell API rodando na porta ${env.PORT}`);
});
