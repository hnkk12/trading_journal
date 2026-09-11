type OpenTrade = {
  id: bigint;
  symbol: string;
  direction: string;
  entryPrice: number;
  quantity: number;
  entryTime: Date;
  stopLoss: number | null;
  takeProfit: number | null;
};

export interface AggregatedPosition {
  symbol: string;
  direction: string;
  entryCount: number; // number of DCA fills making up this position
  totalQuantity: number;
  avgEntryPrice: number; // weighted average across all fills (DCA)
  notionalValue: number;
  margin: number | null; // isolated margin estimate, futures only
  liquidationPrice: number | null; // futures only
  firstEntryTime: Date;
  lastEntryTime: Date;
  fills: { id: bigint; entryPrice: number; quantity: number; entryTime: Date }[];
}

// Groups multiple open trades on the same symbol+direction (DCA scale-ins) into a single
// position with a quantity-weighted average entry price, then estimates isolated margin and
// liquidation price for futures accounts using a standard approximation:
//   long:  liq = avgEntry * (1 - 1/leverage + maintenanceMarginRate)
//   short: liq = avgEntry * (1 + 1/leverage - maintenanceMarginRate)
// This ignores funding fees and cross-margin sharing — it's an estimate for journaling, not a
// substitute for the exchange's own risk engine.
export function aggregateOpenPositions(
  trades: OpenTrade[],
  opts: { marketType: string; leverage: number; maintenanceMarginRate: number }
): AggregatedPosition[] {
  const groups = new Map<string, OpenTrade[]>();
  for (const t of trades) {
    const key = `${t.symbol}::${t.direction}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(t);
  }

  const isFutures = opts.marketType === "futures" && opts.leverage > 0;

  return Array.from(groups.values()).map((fills) => {
    const totalQuantity = fills.reduce((s, f) => s + f.quantity, 0);
    const avgEntryPrice = totalQuantity > 0 ? fills.reduce((s, f) => s + f.entryPrice * f.quantity, 0) / totalQuantity : 0;
    const notionalValue = avgEntryPrice * totalQuantity;
    const direction = fills[0].direction;

    let margin: number | null = null;
    let liquidationPrice: number | null = null;
    if (isFutures) {
      margin = notionalValue / opts.leverage;
      liquidationPrice =
        direction === "long"
          ? avgEntryPrice * (1 - 1 / opts.leverage + opts.maintenanceMarginRate)
          : avgEntryPrice * (1 + 1 / opts.leverage - opts.maintenanceMarginRate);
      if (liquidationPrice < 0) liquidationPrice = 0;
    }

    const sortedByTime = [...fills].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());

    return {
      symbol: fills[0].symbol,
      direction,
      entryCount: fills.length,
      totalQuantity: round(totalQuantity),
      avgEntryPrice: round(avgEntryPrice),
      notionalValue: round(notionalValue),
      margin: margin != null ? round(margin) : null,
      liquidationPrice: liquidationPrice != null ? round(liquidationPrice) : null,
      firstEntryTime: sortedByTime[0].entryTime,
      lastEntryTime: sortedByTime[sortedByTime.length - 1].entryTime,
      fills: sortedByTime.map((f) => ({ id: f.id, entryPrice: f.entryPrice, quantity: f.quantity, entryTime: f.entryTime })),
    };
  });
}

function round(n: number) {
  return Math.round(n * 1e6) / 1e6;
}
