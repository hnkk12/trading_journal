import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { deriveSessionFromTime } from "../services/sessionService";

const router = Router();
router.use(requireAuth);

const executionScoreSchema = z.object({
  beforeScore: z.number().min(0).max(25).default(0),
  duringScore: z.number().min(0).max(35).default(0),
  afterScore: z.number().min(0).max(20).default(0),
  disciplineScore: z.number().min(0).max(20).default(0),
});

const tradeSchema = z.object({
  accountId: z.string(),
  symbol: z.string().min(1),
  assetClass: z.enum(["stock", "crypto", "forex", "futures"]),
  direction: z.enum(["long", "short"]),
  entryPrice: z.number(),
  exitPrice: z.number().nullable().optional(),
  quantity: z.number().positive(),
  entryTime: z.coerce.date(),
  exitTime: z.coerce.date().nullable().optional(),
  stopLoss: z.number().nullable().optional(),
  takeProfit: z.number().nullable().optional(),
  fees: z.number().default(0),
  pnl: z.number().optional(),
  status: z.enum(["open", "closed"]).default("open"),
  timeframe: z.string().optional(),
  followedPlan: z.boolean().default(true),
  strategy: z.string().optional(),
  notes: z.string().optional(),
  executionScore: executionScoreSchema.optional(),
  errorTagIds: z.array(z.string()).default([]),
});

function computePnl(entryPrice: number, exitPrice: number | null | undefined, quantity: number, direction: string) {
  if (exitPrice == null) return 0;
  const diff = exitPrice - entryPrice;
  return direction === "long" ? diff * quantity : -diff * quantity;
}

function computeQuadrant(pnl: number, fees: number, followedPlan: boolean): string {
  const win = pnl - fees > 0;
  if (followedPlan) return win ? "plan_win" : "plan_loss";
  return win ? "impulse_win" : "impulse_loss";
}

async function assertAccountOwnership(accountId: bigint, userId: bigint) {
  return prisma.tradingAccount.findFirst({ where: { id: accountId, userId } });
}

const tradeInclude = {
  executionScore: true,
  errorTags: { include: { errorTag: true } },
};

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { accountId, status, assetClass, month, week } = req.query as Record<string, string | undefined>;
    const accounts = await prisma.tradingAccount.findMany({ where: { userId: req.userId }, select: { id: true } });
    const accountIds = accounts.map((a) => a.id);

    const where: any = { accountId: { in: accountIds } };
    if (accountId) where.accountId = BigInt(accountId);
    if (status) where.status = status;
    if (assetClass) where.assetClass = assetClass;
    if (month) {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 1));
      where.entryTime = { gte: start, lt: end };
    }
    if (week) {
      const start = new Date(week);
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.entryTime = { gte: start, lt: end };
    }

    const trades = await prisma.trade.findMany({
      where,
      include: tradeInclude,
      orderBy: { entryTime: "desc" },
    });
    res.json(trades);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const trade = await prisma.trade.findUnique({ where: { id: BigInt(req.params.id) }, include: tradeInclude });
    if (!trade) return res.status(404).json({ error: "Trade not found" });
    const account = await assertAccountOwnership(trade.accountId, req.userId!);
    if (!account) return res.status(404).json({ error: "Trade not found" });
    res.json(trade);
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const data = tradeSchema.parse(req.body);
    const accountId = BigInt(data.accountId);
    const account = await assertAccountOwnership(accountId, req.userId!);
    if (!account) return res.status(404).json({ error: "Account not found" });

    const pnl = data.pnl ?? computePnl(data.entryPrice, data.exitPrice, data.quantity, data.direction);
    const session = deriveSessionFromTime(data.entryTime);
    const quadrant = computeQuadrant(pnl, data.fees, data.followedPlan);

    const trade = await prisma.trade.create({
      data: {
        accountId,
        userId: req.userId!,
        symbol: data.symbol,
        assetClass: data.assetClass,
        direction: data.direction,
        entryPrice: data.entryPrice,
        exitPrice: data.exitPrice ?? null,
        quantity: data.quantity,
        entryTime: data.entryTime,
        exitTime: data.exitTime ?? null,
        stopLoss: data.stopLoss ?? null,
        takeProfit: data.takeProfit ?? null,
        fees: data.fees,
        pnl,
        status: data.status,
        timeframe: data.timeframe,
        session,
        followedPlan: data.followedPlan,
        strategy: data.strategy,
        notes: data.notes,
        executionScore: data.executionScore
          ? { create: { ...data.executionScore, quadrant } }
          : { create: { quadrant } },
        errorTags: {
          create: data.errorTagIds.map((errorTagId) => ({ errorTagId: BigInt(errorTagId) })),
        },
      },
      include: tradeInclude,
    });
    res.status(201).json(trade);
  })
);

router.put(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.trade.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!existing) return res.status(404).json({ error: "Trade not found" });
    const account = await assertAccountOwnership(existing.accountId, req.userId!);
    if (!account) return res.status(404).json({ error: "Trade not found" });

    const data = tradeSchema.partial().parse(req.body);
    const entryPrice = data.entryPrice ?? existing.entryPrice;
    const exitPrice = data.exitPrice !== undefined ? data.exitPrice : existing.exitPrice;
    const quantity = data.quantity ?? existing.quantity;
    const direction = data.direction ?? existing.direction;
    const fees = data.fees ?? existing.fees;
    const followedPlan = data.followedPlan ?? existing.followedPlan;
    const entryTime = data.entryTime ?? existing.entryTime;

    const pnl = data.pnl ?? computePnl(entryPrice, exitPrice, quantity, direction);
    const session = data.entryTime ? deriveSessionFromTime(entryTime) : existing.session;
    const quadrant = computeQuadrant(pnl, fees, followedPlan);

    const trade = await prisma.trade.update({
      where: { id: existing.id },
      data: {
        ...(data.accountId && { accountId: BigInt(data.accountId) }),
        ...(data.symbol && { symbol: data.symbol }),
        ...(data.assetClass && { assetClass: data.assetClass }),
        direction,
        entryPrice,
        exitPrice,
        quantity,
        entryTime,
        ...(data.exitTime !== undefined && { exitTime: data.exitTime }),
        ...(data.stopLoss !== undefined && { stopLoss: data.stopLoss }),
        ...(data.takeProfit !== undefined && { takeProfit: data.takeProfit }),
        fees,
        pnl,
        ...(data.status && { status: data.status }),
        ...(data.timeframe !== undefined && { timeframe: data.timeframe }),
        session,
        followedPlan,
        ...(data.strategy !== undefined && { strategy: data.strategy }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.executionScore && {
          executionScore: {
            upsert: {
              create: { ...data.executionScore, quadrant },
              update: { ...data.executionScore, quadrant },
            },
          },
        }),
        ...(!data.executionScore && {
          executionScore: { upsert: { create: { quadrant }, update: { quadrant } } },
        }),
        ...(data.errorTagIds && {
          errorTags: {
            deleteMany: {},
            create: data.errorTagIds.map((errorTagId) => ({ errorTagId: BigInt(errorTagId) })),
          },
        }),
      },
      include: tradeInclude,
    });
    res.json(trade);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req: AuthedRequest, res) => {
    const existing = await prisma.trade.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!existing) return res.status(404).json({ error: "Trade not found" });
    const account = await assertAccountOwnership(existing.accountId, req.userId!);
    if (!account) return res.status(404).json({ error: "Trade not found" });
    await prisma.trade.delete({ where: { id: existing.id } });
    res.status(204).send();
  })
);

export default router;
