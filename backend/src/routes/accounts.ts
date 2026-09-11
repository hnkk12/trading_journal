import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const accountSchema = z.object({
  name: z.string().min(1),
  broker: z.string().optional(),
  assetClass: z.enum(["stock", "crypto", "forex", "futures"]),
  marketType: z.enum(["spot", "futures"]),
  currency: z.string().default("USD"),
  initialBalance: z.number().default(0),
  riskPerTradeAmount: z.number().default(0),
  riskPerTradePercent: z.number().default(0),
  leverage: z.number().min(1).default(1),
  maintenanceMarginRate: z.number().min(0).max(1).default(0.005),
});

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "asc" },
    });
    res.json(accounts);
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = accountSchema.parse(req.body);
    const account = await prisma.tradingAccount.create({ data: { ...data, userId: req.userId! } });
    res.status(201).json(account);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.tradingAccount.findFirst({ where: { id: BigInt(req.params.id), userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Account not found" });
    const data = accountSchema.partial().parse(req.body);
    const account = await prisma.tradingAccount.update({ where: { id: existing.id }, data });
    res.json(account);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.tradingAccount.findFirst({ where: { id: BigInt(req.params.id), userId: req.userId } });
    if (!existing) return res.status(404).json({ error: "Account not found" });
    await prisma.tradingAccount.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
