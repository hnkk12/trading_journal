import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import accountRoutes from "./routes/accounts";
import tradeRoutes from "./routes/trades";
import transactionRoutes from "./routes/transactions";
import errorTagRoutes from "./routes/errorTags";
import statsRoutes from "./routes/stats";
import portfolioRoutes from "./routes/portfolio";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/error-tags", errorTagRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/portfolio", portfolioRoutes);

app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Trading journal API listening on http://localhost:${port}`);
});
