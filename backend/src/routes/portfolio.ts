import { Router } from "express";
import { prisma } from "../config/db";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { aggregateOpenPositions } from "../services/positionService";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: req.userId },
      include: {
        trades: true,
        transactions: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const accountSummaries = accounts.map((acc) => {
      const closed = acc.trades.filter((t) => t.status === "closed");
      const open = acc.trades.filter((t) => t.status === "open");
      const netTradePnl = closed.reduce((s, t) => s + t.pnl - t.fees, 0);
      const netFlow = acc.transactions.reduce(
        (s, tx) => s + (tx.type === "deposit" ? tx.amount : -tx.amount),
        0
      );
      const balance = acc.initialBalance + netTradePnl + netFlow;
      const positions = aggregateOpenPositions(open, {
        marketType: acc.marketType,
        leverage: acc.leverage,
        maintenanceMarginRate: acc.maintenanceMarginRate,
      });
      return {
        id: acc.id,
        name: acc.name,
        broker: acc.broker,
        assetClass: acc.assetClass,
        marketType: acc.marketType,
        currency: acc.currency,
        leverage: acc.leverage,
        balance: round2(balance),
        netTradePnl: round2(netTradePnl),
        positions,
        openCount: open.length,
        closedCount: closed.length,
      };
    });

    const totalBalance = accountSummaries.reduce((s, a) => s + a.balance, 0);
    const byAssetClass = new Map<string, { assetClass: string; balance: number; accounts: number }>();
    for (const a of accountSummaries) {
      const entry = byAssetClass.get(a.assetClass) ?? { assetClass: a.assetClass, balance: 0, accounts: 0 };
      entry.balance += a.balance;
      entry.accounts += 1;
      byAssetClass.set(a.assetClass, entry);
    }
    const allocation = Array.from(byAssetClass.values()).map((e) => ({
      ...e,
      balance: round2(e.balance),
      percent: totalBalance !== 0 ? round1((e.balance / totalBalance) * 100) : 0,
    }));

    res.json({
      totalBalance: round2(totalBalance),
      allocation,
      accounts: accountSummaries,
    });
  })
);

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export default router;
