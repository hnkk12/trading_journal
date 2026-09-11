import { Router } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { sessionTimelineData } from "../services/sessionService";
import {
  computeOverview,
  computePerformanceRadar,
  computeDailyPnl,
  computeBySession,
  computeByTimeframe,
  computeBuySell,
  computeActualVsTheoretical,
  computeExecutionSummary,
  computeTradeMatrix,
  computeCommonErrors,
  computeDrawdownSeries,
  computeRMultiples,
  computeByStrategy,
} from "../services/statsService";

const router = Router();
router.use(requireAuth);

const tradeInclude = {
  executionScore: true,
  errorTags: { include: { errorTag: true } },
};

async function fetchFilteredTrades(req: AuthedRequest) {
  const { accountId, assetClass, month, week } = req.query as Record<string, string | undefined>;
  const accountWhere: any = { userId: req.userId };
  if (accountId) accountWhere.id = BigInt(accountId);
  const accounts = await prisma.tradingAccount.findMany({ where: accountWhere, select: { id: true, riskPerTradeAmount: true, riskPerTradePercent: true } });
  const accountIds = accounts.map((a) => a.id);

  const where: any = { accountId: { in: accountIds } };
  if (assetClass) where.assetClass = assetClass;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.entryTime = { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
  }
  if (week) {
    const start = new Date(week);
    where.entryTime = { gte: start, lt: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000) };
  }

  const trades = await prisma.trade.findMany({ where, include: tradeInclude, orderBy: { entryTime: "asc" } });
  const risk = accounts.length === 1 ? { amount: accounts[0].riskPerTradeAmount, percent: accounts[0].riskPerTradePercent } : undefined;
  return { trades, accounts, risk };
}

router.get(
  "/overview",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades, accounts, risk } = await fetchFilteredTrades(req);
    const overview = computeOverview(trades, risk);
    const balance = accounts.length
      ? await prisma.tradingAccount
          .findMany({ where: { id: { in: accounts.map((a) => a.id) } } })
          .then((accs) => accs.reduce((s, a) => s + a.initialBalance, 0) + overview.netProfit)
      : 0;
    const deposits = await prisma.tradingAccountTransaction.aggregate({
      where: { accountId: { in: accounts.map((a) => a.id) }, type: "deposit" },
      _sum: { amount: true },
    });
    const withdrawals = await prisma.tradingAccountTransaction.aggregate({
      where: { accountId: { in: accounts.map((a) => a.id) }, type: "withdraw" },
      _sum: { amount: true },
    });
    const netFlow = (deposits._sum.amount ?? 0) - (withdrawals._sum.amount ?? 0);

    let statusScore = 10;
    if (overview.lossStreak >= 2) statusScore -= overview.lossStreak;
    if (overview.netProfit < 0) statusScore -= 2;
    if (overview.maxDrawdown > 0 && overview.recoveryFactor < 1) statusScore -= 1;
    statusScore = Math.max(1, Math.min(10, statusScore));
    const statusMessage =
      statusScore >= 8 ? "Tốt — tiếp tục duy trì kỷ luật" : statusScore >= 5 ? "Cẩn thận — giảm khối lượng" : "Dừng lại — xem xét lại chiến lược";

    const rMultiples = computeRMultiples(trades);

    res.json({
      ...overview,
      avgR: rMultiples.avgR,
      accountBalance: round2(balance),
      netFlow: round2(netFlow),
      statusScore,
      statusMessage,
    });
  })
);

router.get(
  "/performance-radar",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computePerformanceRadar(trades));
  })
);

router.get(
  "/daily-pnl",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeDailyPnl(trades));
  })
);

router.get(
  "/by-session",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeBySession(trades));
  })
);

router.get(
  "/by-timeframe",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeByTimeframe(trades));
  })
);

router.get(
  "/buy-sell",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeBuySell(trades));
  })
);

router.get(
  "/actual-vs-theoretical",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeActualVsTheoretical(trades));
  })
);

router.get(
  "/execution",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeExecutionSummary(trades));
  })
);

router.get(
  "/trade-matrix",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeTradeMatrix(trades));
  })
);

router.get(
  "/common-errors",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeCommonErrors(trades));
  })
);

router.get(
  "/drawdown",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeDrawdownSeries(trades));
  })
);

router.get(
  "/by-strategy",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { trades } = await fetchFilteredTrades(req);
    res.json(computeByStrategy(trades));
  })
);

router.get(
  "/sessions",
  asyncHandler(async (_req: AuthedRequest, res) => {
    res.json(sessionTimelineData(new Date()));
  })
);

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default router;
