import { useFilters } from "../store/filterContext";
import { useDailyPnl, useOverview, usePerformanceRadar } from "../api/hooks";
import StatCard from "../components/cards/StatCard";
import Panel from "../components/cards/Panel";
import SessionTimeline from "../components/charts/SessionTimeline";
import PerformanceRadarChart from "../components/charts/PerformanceRadarChart";
import WinRateDonut from "../components/charts/WinRateDonut";
import CumulativePnlChart from "../components/charts/CumulativePnlChart";
import DailyPnlBarChart from "../components/charts/DailyPnlBarChart";
import { formatCurrency, formatNumber, formatPercent, formatPlainCurrency } from "../utils/format";

export default function Dashboard() {
  const filters = useFilters();
  const { data: overview } = useOverview(filters);
  const { data: radar } = usePerformanceRadar(filters);
  const { data: daily } = useDailyPnl(filters);

  return (
    <div className="space-y-6">
      <SessionTimeline />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <StatCard
          label="Net Profit"
          value={overview ? formatCurrency(overview.netProfit) : "—"}
          sub={overview ? formatPercent((overview.netProfit / Math.max(overview.accountBalance - overview.netProfit, 1)) * 100) : undefined}
          valueClassName={overview && overview.netProfit >= 0 ? "text-brand" : "text-loss"}
        />
        <StatCard label="Sharpe-like Ratio" value={overview ? formatNumber(overview.sharpeLike) : "—"} valueClassName="text-amber-600" />
        <StatCard label="Profit Factor" value={overview ? formatNumber(overview.profitFactor) : "—"} valueClassName="text-sky-600" />
        <StatCard
          label="Max Drawdown"
          value={overview ? formatPlainCurrency(overview.maxDrawdown) : "—"}
          sub={overview && overview.accountBalance ? formatPercent(-(overview.maxDrawdown / overview.accountBalance) * 100) : undefined}
          valueClassName="text-loss"
        />
        <StatCard label="Recovery Factor" value={overview ? formatNumber(overview.recoveryFactor) : "—"} valueClassName="text-brand" />
        <StatCard label="Kỳ vọng TB mỗi lệnh" value={overview ? formatCurrency(overview.expectancy) : "—"} valueClassName="text-brand" />
        <StatCard
          label="Avg R-Multiple"
          value={overview ? `${overview.avgR >= 0 ? "+" : ""}${formatNumber(overview.avgR)}R` : "—"}
          info="Lợi nhuận trung bình tính theo bội số rủi ro (R) — chỉ tính trên lệnh có đặt Stop Loss"
          valueClassName={overview && overview.avgR >= 0 ? "text-brand" : "text-loss"}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Tiền nạp/rút" value={overview ? formatCurrency(overview.netFlow) : "—"} valueClassName="text-brand" />
        <StatCard label="Số dư tài khoản" value={overview ? formatPlainCurrency(overview.accountBalance) : "—"} />
        <div className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-500">⚠ Trạng thái hôm nay</p>
            <p className="text-sm font-bold text-amber-700">{overview?.statusMessage ?? "—"}</p>
          </div>
          <div className="text-right text-sm font-bold text-amber-700">
            {overview?.statusScore ?? "—"}
            <span className="text-xs font-medium text-amber-400"> /10</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">Thống kê &amp; hiệu suất</h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-4">
            <Panel>
              <PerformanceRadarChart data={radar} />
              <div className="mt-4 border-t border-gray-100 pt-4">
                <WinRateDonut
                  winRate={overview?.winRate ?? 0}
                  total={overview?.totalTrades ?? 0}
                  won={overview?.wonTrades ?? 0}
                  lost={overview?.lostTrades ?? 0}
                />
              </div>
            </Panel>
          </div>

          <div className="space-y-4 xl:col-span-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Tổng lợi nhuận" value={overview ? formatPlainCurrency(overview.grossProfit) : "—"} valueClassName="text-brand" />
              <StatCard label="Tổng thua lỗ" value={overview ? formatPlainCurrency(overview.grossLoss) : "—"} valueClassName="text-loss" />
              <StatCard label="Phí giao dịch" value={overview ? formatPlainCurrency(overview.totalFees) : "—"} />
              <StatCard label="Net Profit" value={overview ? formatCurrency(overview.netProfit) : "—"} valueClassName="text-brand" />
              <StatCard label="Rủi ro/lệnh ($)" value={overview ? formatPlainCurrency(overview.riskPerTradeAmount) : "—"} valueClassName="text-amber-600" />
              <StatCard label="Rủi ro/lệnh (%)" value={overview ? formatPercent(overview.riskPerTradePercent) : "—"} valueClassName="text-amber-600" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Panel title="Avg W/L" className="sm:col-span-1">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-brand">{overview ? formatCurrency(overview.avgWin) : "—"}</span>
                  <span className="text-loss">{overview ? formatCurrency(overview.avgLoss) : "—"}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full bg-brand" style={{ width: "60%" }} />
                </div>
              </Panel>
              <StatCard label="Big Win $" value={overview ? formatPlainCurrency(overview.bigWin) : "—"} valueClassName="text-brand" />
              <StatCard label="Big Loss $" value={overview ? formatPlainCurrency(overview.bigLoss) : "—"} valueClassName="text-loss" />
              <StatCard
                label="Chuỗi thắng/thua"
                value={
                  overview ? (
                    <span>
                      <span className="text-brand">{overview.winStreak}</span> / <span className="text-loss">{overview.lossStreak}</span>
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            </div>

            <Panel title="P&L tích lũy theo ngày">
              <CumulativePnlChart data={daily} />
            </Panel>
            <Panel title="Lợi nhuận theo ngày (Net/ngày)">
              <DailyPnlBarChart data={daily} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
