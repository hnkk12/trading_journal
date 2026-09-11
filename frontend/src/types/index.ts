export type AssetClass = "stock" | "crypto" | "forex" | "futures";
export type MarketType = "spot" | "futures";
export type Direction = "long" | "short";
export type TradeStatus = "open" | "closed";

export interface User {
  id: string;
  email: string;
  name: string;
  timezone?: string;
}

export interface Account {
  id: string;
  name: string;
  broker?: string | null;
  assetClass: AssetClass;
  marketType: MarketType;
  currency: string;
  initialBalance: number;
  riskPerTradeAmount: number;
  riskPerTradePercent: number;
  leverage: number;
  maintenanceMarginRate: number;
  createdAt: string;
}

export interface ErrorTag {
  id: string;
  name: string;
  severity: number;
}

export interface ExecutionScore {
  beforeScore: number;
  duringScore: number;
  afterScore: number;
  disciplineScore: number;
  quadrant: string;
}

export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  assetClass: AssetClass;
  direction: Direction;
  entryPrice: number;
  exitPrice: number | null;
  quantity: number;
  entryTime: string;
  exitTime: string | null;
  stopLoss: number | null;
  takeProfit: number | null;
  fees: number;
  pnl: number;
  status: TradeStatus;
  timeframe: string | null;
  session: string;
  followedPlan: boolean;
  strategy: string | null;
  notes: string | null;
  executionScore?: ExecutionScore | null;
  errorTags?: { errorTag: ErrorTag }[];
}

export interface Transaction {
  id: string;
  accountId: string;
  type: "deposit" | "withdraw";
  amount: number;
  date: string;
  note?: string | null;
}

export interface OverviewStats {
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  totalFees: number;
  profitFactor: number;
  winRate: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  recoveryFactor: number;
  sharpeLike: number;
  bigWin: number;
  bigLoss: number;
  winStreak: number;
  lossStreak: number;
  totalTrades: number;
  wonTrades: number;
  lostTrades: number;
  riskPerTradeAmount: number;
  riskPerTradePercent: number;
  avgR: number;
  accountBalance: number;
  netFlow: number;
  statusScore: number;
  statusMessage: string;
}

export interface PerformanceRadar {
  axes: {
    profitFactor: number;
    avgWinLoss: number;
    maxDrawdown: number;
    winRate: number;
    recovery: number;
    consistency: number;
  };
  total: number;
  tradeCount: number;
}

export interface DailyPnlPoint {
  date: string;
  net: number;
  cumulative: number;
}

export interface SessionStat {
  session: string;
  trades: number;
  netProfit: number;
  winRate: number;
}

export interface TimeframeStat {
  timeframe: string;
  trades: number;
  netProfit: number;
}

export interface BuySellStats {
  buy: { trades: number; netProfit: number; winRate: number };
  sell: { trades: number; netProfit: number; winRate: number };
}

export interface ActualVsTheoreticalPoint {
  index: number;
  actual: number;
  theoretical: number;
}

export interface ExecutionSummary {
  total: number;
  grade: string;
  stages: { key: string; label: string; score: number; max: number }[];
  tradeCount: number;
}

export interface TradeMatrixBucket {
  key: string;
  label: string;
  count: number;
  percent: number;
  netProfit: number;
}

export interface CommonError {
  name: string;
  severity: number;
  count: number;
  cumulativePercent: number;
}

export interface DrawdownPoint {
  date: string;
  drawdown: number;
  equity: number;
}

export interface StrategyStat {
  strategy: string;
  trades: number;
  netProfit: number;
  winRate: number;
}

export interface SessionWindow {
  name: string;
  startUTC: number;
  endUTC: number;
  isOpen: boolean;
}

export interface AggregatedPosition {
  symbol: string;
  direction: Direction;
  entryCount: number;
  totalQuantity: number;
  avgEntryPrice: number;
  notionalValue: number;
  margin: number | null;
  liquidationPrice: number | null;
  firstEntryTime: string;
  lastEntryTime: string;
  fills: { id: string; entryPrice: number; quantity: number; entryTime: string }[];
}

export interface PortfolioAccountSummary {
  id: string;
  name: string;
  broker?: string | null;
  assetClass: AssetClass;
  marketType: MarketType;
  currency: string;
  leverage: number;
  balance: number;
  netTradePnl: number;
  positions: AggregatedPosition[];
  openCount: number;
  closedCount: number;
}

export interface PortfolioResponse {
  totalBalance: number;
  allocation: { assetClass: AssetClass; balance: number; accounts: number; percent: number }[];
  accounts: PortfolioAccountSummary[];
}
