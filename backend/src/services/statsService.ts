type TradeWithRelations = {
  id: bigint;
  pnl: number;
  fees: number;
  entryPrice: number;
  exitPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  quantity: number;
  direction: string;
  entryTime: Date;
  exitTime: Date | null;
  status: string;
  timeframe: string | null;
  session: string;
  followedPlan: boolean;
  assetClass: string;
  symbol: string;
  strategy?: string | null;
  executionScore?: {
    beforeScore: number;
    duringScore: number;
    afterScore: number;
    disciplineScore: number;
    quadrant: string;
  } | null;
  errorTags?: { errorTag: { id: bigint; name: string; severity: number } }[];
};

function closedOnly(trades: TradeWithRelations[]) {
  return trades.filter((t) => t.status === "closed");
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function dailyPnlMap(trades: TradeWithRelations[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of closedOnly(trades)) {
    const day = (t.exitTime ?? t.entryTime).toISOString().slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + t.pnl - t.fees);
  }
  return map;
}

export function computeOverview(trades: TradeWithRelations[], accountRisk?: { amount: number; percent: number }) {
  const closed = closedOnly(trades);
  const wins = closed.filter((t) => t.pnl - t.fees > 0);
  const losses = closed.filter((t) => t.pnl - t.fees < 0);

  const grossProfit = wins.reduce((s, t) => s + (t.pnl - t.fees), 0);
  const grossLoss = losses.reduce((s, t) => s + (t.pnl - t.fees), 0); // negative
  const totalFees = closed.reduce((s, t) => s + t.fees, 0);
  const netProfit = grossProfit + grossLoss;

  const profitFactor = grossLoss !== 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? Infinity : 0;
  const winRate = closed.length ? wins.length / closed.length : 0;

  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0; // negative
  const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;

  // Equity curve & max drawdown / recovery factor
  const dailyMap = dailyPnlMap(trades);
  const days = Array.from(dailyMap.keys()).sort();
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const dailyReturns: number[] = [];
  for (const day of days) {
    const change = dailyMap.get(day)!;
    dailyReturns.push(change);
    equity += change;
    if (equity > peak) peak = equity;
    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  const recoveryFactor = maxDrawdown > 0 ? netProfit / maxDrawdown : netProfit > 0 ? Infinity : 0;

  const meanDaily = dailyReturns.length ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0;
  const sdDaily = stdev(dailyReturns);
  const sharpeLike = sdDaily > 0 ? meanDaily / sdDaily : 0;

  const bigWin = wins.length ? Math.max(...wins.map((t) => t.pnl - t.fees)) : 0;
  const bigLoss = losses.length ? Math.min(...losses.map((t) => t.pnl - t.fees)) : 0;

  // Current streak from most recent closed trades
  const sortedByTime = [...closed].sort(
    (a, b) => (b.exitTime ?? b.entryTime).getTime() - (a.exitTime ?? a.entryTime).getTime()
  );
  let winStreak = 0;
  let lossStreak = 0;
  for (const t of sortedByTime) {
    const net = t.pnl - t.fees;
    if (net > 0) {
      if (lossStreak > 0) break;
      winStreak++;
    } else if (net < 0) {
      if (winStreak > 0) break;
      lossStreak++;
    } else break;
  }

  return {
    netProfit,
    grossProfit,
    grossLoss,
    totalFees,
    profitFactor: Number.isFinite(profitFactor) ? profitFactor : 0,
    winRate,
    expectancy,
    avgWin,
    avgLoss,
    maxDrawdown,
    recoveryFactor: Number.isFinite(recoveryFactor) ? recoveryFactor : 0,
    sharpeLike,
    bigWin,
    bigLoss,
    winStreak,
    lossStreak,
    totalTrades: closed.length,
    wonTrades: wins.length,
    lostTrades: losses.length,
    riskPerTradeAmount: accountRisk?.amount ?? 0,
    riskPerTradePercent: accountRisk?.percent ?? 0,
  };
}

export function computePerformanceRadar(trades: TradeWithRelations[]) {
  const overview = computeOverview(trades);
  const closed = closedOnly(trades);

  const dailyMap = dailyPnlMap(trades);
  const dailyReturns = Array.from(dailyMap.values());
  const sd = stdev(dailyReturns);
  const meanAbs = dailyReturns.length
    ? dailyReturns.reduce((a, b) => a + Math.abs(b), 0) / dailyReturns.length
    : 0;
  // consistency: lower relative volatility -> higher score
  const consistency = meanAbs > 0 ? clamp(100 - (sd / meanAbs) * 20, 0, 100) : 50;

  const profitFactorScore = clamp((overview.profitFactor / 3) * 100, 0, 100);
  const winRateScore = clamp(overview.winRate * 100, 0, 100);
  const avgWinLossRatio = overview.avgLoss !== 0 ? Math.abs(overview.avgWin / overview.avgLoss) : overview.avgWin > 0 ? 3 : 0;
  const avgWinLossScore = clamp((avgWinLossRatio / 3) * 100, 0, 100);
  const recoveryScore = clamp((overview.recoveryFactor / 5) * 100, 0, 100);
  const drawdownScore = overview.netProfit > 0 ? clamp(100 - (overview.maxDrawdown / Math.max(overview.netProfit, 1)) * 100, 0, 100) : clamp(100 - overview.maxDrawdown / 10, 0, 100);

  const axes = {
    profitFactor: round1(profitFactorScore),
    avgWinLoss: round1(avgWinLossScore),
    maxDrawdown: round1(drawdownScore),
    winRate: round1(winRateScore),
    recovery: round1(recoveryScore),
    consistency: round1(consistency),
  };
  const total = round1(
    (axes.profitFactor + axes.avgWinLoss + axes.maxDrawdown + axes.winRate + axes.recovery + axes.consistency) / 6
  );

  return { axes, total, tradeCount: closed.length };
}

export function computeDailyPnl(trades: TradeWithRelations[]) {
  const dailyMap = dailyPnlMap(trades);
  const days = Array.from(dailyMap.keys()).sort();
  let cumulative = 0;
  return days.map((day) => {
    const net = dailyMap.get(day)!;
    cumulative += net;
    return { date: day, net: round2(net), cumulative: round2(cumulative) };
  });
}

export function computeBySession(trades: TradeWithRelations[]) {
  const closed = closedOnly(trades);
  const groups: Record<string, TradeWithRelations[]> = {};
  for (const t of closed) {
    const key = t.session ?? "unknown";
    (groups[key] ??= []).push(t);
  }
  return Object.entries(groups).map(([session, list]) => {
    const net = list.reduce((s, t) => s + t.pnl - t.fees, 0);
    const wins = list.filter((t) => t.pnl - t.fees > 0).length;
    return { session, trades: list.length, netProfit: round2(net), winRate: list.length ? round1((wins / list.length) * 100) : 0 };
  });
}

export function computeByTimeframe(trades: TradeWithRelations[]) {
  const closed = closedOnly(trades);
  const groups: Record<string, TradeWithRelations[]> = {};
  for (const t of closed) {
    const key = t.timeframe ?? "unknown";
    (groups[key] ??= []).push(t);
  }
  return Object.entries(groups).map(([timeframe, list]) => {
    const net = list.reduce((s, t) => s + t.pnl - t.fees, 0);
    return { timeframe, trades: list.length, netProfit: round2(net) };
  });
}

export function computeBuySell(trades: TradeWithRelations[]) {
  const closed = closedOnly(trades);
  const buys = closed.filter((t) => t.direction === "long");
  const sells = closed.filter((t) => t.direction === "short");
  const sum = (list: TradeWithRelations[]) => list.reduce((s, t) => s + t.pnl - t.fees, 0);
  return {
    buy: { trades: buys.length, netProfit: round2(sum(buys)), winRate: buys.length ? round1((buys.filter((t) => t.pnl - t.fees > 0).length / buys.length) * 100) : 0 },
    sell: { trades: sells.length, netProfit: round2(sum(sells)), winRate: sells.length ? round1((sells.filter((t) => t.pnl - t.fees > 0).length / sells.length) * 100) : 0 },
  };
}

export function computeActualVsTheoretical(trades: TradeWithRelations[]) {
  const closed = [...closedOnly(trades)].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
  let actualCum = 0;
  let theoreticalCum = 0;
  return closed.map((t, idx) => {
    const actualNet = t.pnl - t.fees;
    let theoreticalNet = actualNet;
    if (!t.followedPlan && t.stopLoss != null && t.takeProfit != null) {
      const risk = Math.abs(t.entryPrice - t.stopLoss);
      const reward = Math.abs(t.takeProfit - t.entryPrice);
      const sign = t.direction === "long" ? 1 : -1;
      theoreticalNet = risk > 0 ? sign * (reward / risk) * Math.abs(actualNet !== 0 ? Math.abs(actualNet) : 1) : actualNet;
      // Use planned R-multiple scaled by risk amount actually taken (approximate with |actualNet| as 1R baseline if trade lost)
      theoreticalNet = actualNet < 0 ? Math.abs(actualNet) * (reward / risk || 1) : actualNet;
    }
    actualCum += actualNet;
    theoreticalCum += theoreticalNet;
    return { index: idx + 1, actual: round2(actualCum), theoretical: round2(theoreticalCum) };
  });
}

export function computeExecutionSummary(trades: TradeWithRelations[]) {
  const closed = closedOnly(trades).filter((t) => t.executionScore);
  if (closed.length === 0) {
    return {
      total: 0,
      grade: "N/A",
      stages: [
        { key: "before", label: "Trước lệnh", score: 0, max: 25 },
        { key: "during", label: "Trong lệnh", score: 0, max: 35 },
        { key: "after", label: "Sau lệnh", score: 0, max: 20 },
        { key: "discipline", label: "Kỷ luật", score: 0, max: 20 },
      ],
      tradeCount: 0,
    };
  }
  const avg = (fn: (t: TradeWithRelations) => number) => closed.reduce((s, t) => s + fn(t), 0) / closed.length;
  const before = avg((t) => t.executionScore!.beforeScore);
  const during = avg((t) => t.executionScore!.duringScore);
  const after = avg((t) => t.executionScore!.afterScore);
  const discipline = avg((t) => t.executionScore!.disciplineScore);
  const total = before + during + after + discipline;
  return {
    total: round1(total),
    grade: gradeFor(total),
    stages: [
      { key: "before", label: "Trước lệnh", score: round1(before), max: 25 },
      { key: "during", label: "Trong lệnh", score: round1(during), max: 35 },
      { key: "after", label: "Sau lệnh", score: round1(after), max: 20 },
      { key: "discipline", label: "Kỷ luật", score: round1(discipline), max: 20 },
    ],
    tradeCount: closed.length,
  };
}

export function computeTradeMatrix(trades: TradeWithRelations[]) {
  const closed = closedOnly(trades);
  const buckets = {
    plan_win: { label: "Loại 1 — Theo kế hoạch, thắng", trades: [] as TradeWithRelations[] },
    plan_loss: { label: "Loại 2 — Theo kế hoạch, thua", trades: [] as TradeWithRelations[] },
    impulse_loss: { label: "Loại 3 — Bốc đồng/trả thù, thua", trades: [] as TradeWithRelations[] },
    impulse_win: { label: "Loại 4 — Bốc đồng/trả thù, thắng", trades: [] as TradeWithRelations[] },
  };
  for (const t of closed) {
    const net = t.pnl - t.fees;
    const win = net > 0;
    const key = t.followedPlan ? (win ? "plan_win" : "plan_loss") : win ? "impulse_win" : "impulse_loss";
    buckets[key].trades.push(t);
  }
  const total = closed.length || 1;
  return Object.entries(buckets).map(([key, b]) => ({
    key,
    label: b.label,
    count: b.trades.length,
    percent: round1((b.trades.length / total) * 100),
    netProfit: round2(b.trades.reduce((s, t) => s + t.pnl - t.fees, 0)),
  }));
}

export function computeCommonErrors(trades: TradeWithRelations[]) {
  const counts = new Map<bigint, { name: string; severity: number; count: number }>();
  for (const t of trades) {
    for (const link of t.errorTags ?? []) {
      const tag = link.errorTag;
      const existing = counts.get(tag.id);
      if (existing) existing.count++;
      else counts.set(tag.id, { name: tag.name, severity: tag.severity, count: 1 });
    }
  }
  const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);
  const totalCount = sorted.reduce((s, e) => s + e.count, 0) || 1;
  let cumulative = 0;
  return sorted.map((e) => {
    cumulative += e.count;
    return { ...e, cumulativePercent: round1((cumulative / totalCount) * 100) };
  });
}

// Drawdown (underwater equity) series: for each day, how far the running equity curve
// sits below its running peak. Mirrors the max-drawdown figure in computeOverview but
// exposes the full time series so it can be charted (TradeZella/Edgewonk-style).
export function computeDrawdownSeries(trades: TradeWithRelations[]) {
  const dailyMap = dailyPnlMap(trades);
  const days = Array.from(dailyMap.keys()).sort();
  let equity = 0;
  let peak = 0;
  return days.map((day) => {
    equity += dailyMap.get(day)!;
    if (equity > peak) peak = equity;
    return { date: day, drawdown: round2(-(peak - equity)), equity: round2(equity) };
  });
}

// R-multiple: how many "risk units" (distance from entry to stop loss) a trade returned.
// Only computable for trades with a stop loss set — undefined risk means undefined R.
export function computeRMultiples(trades: TradeWithRelations[]) {
  const closed = closedOnly(trades).filter((t) => t.stopLoss != null);
  const values = closed.map((t) => {
    const riskPerUnit = Math.abs(t.entryPrice - (t.stopLoss as number));
    const netPnl = t.pnl - t.fees;
    const riskAmount = riskPerUnit * t.quantity;
    return riskAmount > 0 ? netPnl / riskAmount : 0;
  });
  const avgR = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  return { avgR: round2(avgR), sampleSize: values.length };
}

export function computeByStrategy(trades: TradeWithRelations[]) {
  const closed = closedOnly(trades);
  const groups: Record<string, TradeWithRelations[]> = {};
  for (const t of closed) {
    const key = t.strategy?.trim() || "Chưa gắn nhãn";
    (groups[key] ??= []).push(t);
  }
  return Object.entries(groups)
    .map(([strategy, list]) => {
      const net = list.reduce((s, t) => s + t.pnl - t.fees, 0);
      const wins = list.filter((t) => t.pnl - t.fees > 0).length;
      return {
        strategy,
        trades: list.length,
        netProfit: round2(net),
        winRate: list.length ? round1((wins / list.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.netProfit - a.netProfit);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function gradeFor(total: number): string {
  if (total >= 90) return "A";
  if (total >= 75) return "B";
  if (total >= 60) return "C";
  if (total >= 40) return "D";
  return "F";
}
