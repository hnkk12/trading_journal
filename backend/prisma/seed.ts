import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SYMBOLS: Record<string, string[]> = {
  forex: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
  crypto: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
  stock: ["AAPL", "TSLA", "NVDA"],
  futures: ["ES", "NQ", "GC"],
};
const TIMEFRAMES = ["M15", "M30", "H1", "H4"];
const DEFAULT_ERRORS = [
  { name: "Dời Stop Loss", severity: 2 },
  { name: "Giao dịch sai phiên", severity: 1 },
  { name: "Chốt lời quá sớm", severity: 2 },
  { name: "Trả thù thị trường", severity: 3 },
  { name: "Vào sớm chưa có nến xác nhận", severity: 1 },
  { name: "Nhồi lệnh gồng lỗ", severity: 2 },
  { name: "Giao dịch vì buồn chán", severity: 3 },
  { name: "Sai khối lượng", severity: 1 },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function deriveSession(date: Date): string {
  const hour = date.getUTCHours();
  if (hour >= 13 && hour < 22) return "newyork";
  if (hour >= 8 && hour < 17) return "london";
  if (hour >= 0 && hour < 9) return "tokyo";
  return "sydney";
}

async function main() {
  // Trading Journal no longer owns the users table (it's hkfin's) — the demo
  // account must already exist there. Register it on hkfin first, then point
  // DEMO_USER_EMAIL at it (defaults to demo@tradingjournal.app).
  const email = process.env.DEMO_USER_EMAIL || "demo@tradingjournal.app";
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `No hkfin user found for ${email}. Register this account on hkfin first, then re-run the seed.`
    );
    process.exit(1);
  }

  const existingAccounts = await prisma.tradingAccount.count({ where: { userId: user.id } });
  if (existingAccounts > 0) {
    console.log(`User ${email} already has trading data, skipping seed.`);
    return;
  }

  const errorTags = await Promise.all(
    DEFAULT_ERRORS.map((e) => prisma.tradeErrorTag.create({ data: { ...e, userId: user.id } }))
  );

  const acc1 = await prisma.tradingAccount.create({
    data: {
      userId: user.id,
      name: "acc1",
      broker: "Exness",
      assetClass: "forex",
      marketType: "spot",
      currency: "USD",
      initialBalance: 100000,
      riskPerTradeAmount: 1000,
      riskPerTradePercent: 1,
    },
  });
  const acc2 = await prisma.tradingAccount.create({
    data: {
      userId: user.id,
      name: "acc-crypto",
      broker: "Binance",
      assetClass: "crypto",
      marketType: "futures",
      currency: "USDT",
      initialBalance: 20000,
      riskPerTradeAmount: 300,
      riskPerTradePercent: 1.5,
    },
  });
  const acc3 = await prisma.tradingAccount.create({
    data: {
      userId: user.id,
      name: "acc-stocks",
      broker: "TCBS",
      assetClass: "stock",
      marketType: "spot",
      currency: "USD",
      initialBalance: 15000,
      riskPerTradeAmount: 200,
      riskPerTradePercent: 1,
    },
  });

  await prisma.tradingAccountTransaction.create({
    data: { accountId: acc1.id, type: "deposit", amount: 100000, occurredAt: new Date("2026-07-01T00:00:00Z"), note: "Initial funding" },
  });

  const accounts = [acc1, acc2, acc3];
  let day = new Date("2026-07-01T00:00:00Z");
  const trades = [];
  for (let i = 0; i < 40; i++) {
    const account = pick(accounts);
    const symbols = SYMBOLS[account.assetClass];
    const direction = Math.random() > 0.5 ? "long" : "short";
    const entryPrice = rand(50, 2000);
    const win = Math.random() < 0.575; // ~57.5% win rate to mirror reference
    const followedPlan = Math.random() < 0.68;
    const riskAmount = account.riskPerTradeAmount * rand(0.6, 1.4);
    const pnl = win ? riskAmount * rand(1.2, 2.6) : -riskAmount * rand(0.5, 1.1);
    const fees = rand(2, 12);
    const quantity = rand(0.1, 5);
    const priceMove = pnl / quantity / (direction === "long" ? 1 : -1);
    const exitPrice = entryPrice + priceMove;
    const stopLoss = direction === "long" ? entryPrice - riskAmount / quantity : entryPrice + riskAmount / quantity;
    const takeProfit = direction === "long" ? entryPrice + (riskAmount * 2) / quantity : entryPrice - (riskAmount * 2) / quantity;

    day = new Date(day.getTime() + rand(6, 30) * 60 * 60 * 1000);
    const entryTime = new Date(day);
    const exitTime = new Date(entryTime.getTime() + rand(20, 240) * 60 * 1000);
    const session = deriveSession(entryTime);
    const netWin = pnl - fees > 0;
    const quadrant = followedPlan ? (netWin ? "plan_win" : "plan_loss") : netWin ? "impulse_win" : "impulse_loss";

    const trade = await prisma.trade.create({
      data: {
        accountId: account.id,
        userId: user.id,
        symbol: pick(symbols),
        assetClass: account.assetClass,
        direction,
        entryPrice: round(entryPrice),
        exitPrice: round(exitPrice),
        quantity: round(quantity),
        entryTime,
        exitTime,
        stopLoss: round(stopLoss),
        takeProfit: round(takeProfit),
        fees: round(fees),
        pnl: round(pnl),
        status: "closed",
        timeframe: pick(TIMEFRAMES),
        session,
        followedPlan,
        notes: win ? "Đúng kế hoạch, quản lý lệnh tốt." : "Cần xem lại điểm vào lệnh.",
        executionScore: {
          create: {
            beforeScore: followedPlan ? rand(18, 25) : rand(5, 15),
            duringScore: followedPlan ? rand(25, 35) : rand(10, 22),
            afterScore: rand(10, 20),
            disciplineScore: followedPlan ? rand(15, 20) : rand(4, 12),
            quadrant,
          },
        },
        ...(!followedPlan && {
          errorTags: {
            create: [{ errorTagId: pick(errorTags).id }],
          },
        }),
      },
    });
    trades.push(trade);
  }

  console.log(`Seeded ${email} with ${accounts.length} accounts and ${trades.length} trades.`);
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
