import { useFilters } from "../store/filterContext";
import {
  useActualVsTheoretical,
  useByStrategy,
  useBySession,
  useByTimeframe,
  useBuySell,
  useDrawdown,
} from "../api/hooks";
import Panel from "../components/cards/Panel";
import ActualVsTheoreticalChart from "../components/charts/ActualVsTheoreticalChart";
import DrawdownChart from "../components/charts/DrawdownChart";
import { formatCurrency, formatPercent, SESSION_LABEL } from "../utils/format";

export default function Analytics() {
  const filters = useFilters();
  const { data: bySession } = useBySession(filters);
  const { data: byTimeframe } = useByTimeframe(filters);
  const { data: buySell } = useBuySell(filters);
  const { data: avt } = useActualVsTheoretical(filters);
  const { data: drawdown } = useDrawdown(filters);
  const { data: byStrategy } = useByStrategy(filters);

  const maxTf = Math.max(1, ...(byTimeframe ?? []).map((t) => Math.abs(t.netProfit)));
  const maxStrategy = Math.max(1, ...(byStrategy ?? []).map((s) => Math.abs(s.netProfit)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Theo khung giờ">
          <div className="space-y-2">
            {byTimeframe?.map((t) => (
              <div key={t.timeframe} className="flex items-center gap-2 text-xs">
                <span className="w-10 shrink-0 font-medium text-gray-500">{t.timeframe}</span>
                <div className="relative h-2.5 flex-1 rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${t.netProfit >= 0 ? "bg-brand" : "bg-loss"}`}
                    style={{ width: `${(Math.abs(t.netProfit) / maxTf) * 100}%` }}
                  />
                </div>
                <span className={`w-16 shrink-0 text-right font-semibold ${t.netProfit >= 0 ? "text-brand" : "text-loss"}`}>
                  {formatCurrency(t.netProfit)}
                </span>
              </div>
            ))}
            {!byTimeframe?.length && <p className="text-xs text-gray-400">Chưa có dữ liệu.</p>}
          </div>
        </Panel>

        <Panel title="Buy / Sell">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
              <span className="text-sm font-semibold text-emerald-700">BUY</span>
              <span className="text-sm font-semibold text-emerald-700">{buySell ? formatCurrency(buySell.buy.netProfit) : "—"}</span>
              <span className="text-xs text-emerald-500">{buySell?.buy.winRate}%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2">
              <span className="text-sm font-semibold text-rose-700">SELL</span>
              <span className="text-sm font-semibold text-rose-700">{buySell ? formatCurrency(buySell.sell.netProfit) : "—"}</span>
              <span className="text-xs text-rose-500">{buySell?.sell.winRate}%</span>
            </div>
          </div>
        </Panel>

        <Panel title="Theo phiên">
          <div className="space-y-2">
            {bySession?.map((s) => (
              <div key={s.session} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{SESSION_LABEL[s.session] ?? s.session}</span>
                <span className={`font-semibold ${s.netProfit >= 0 ? "text-brand" : "text-loss"}`}>
                  {formatCurrency(s.netProfit)}
                </span>
                <span className="text-xs text-gray-400">{formatPercent(s.winRate)}</span>
              </div>
            ))}
            {!bySession?.length && <p className="text-xs text-gray-400">Chưa có dữ liệu.</p>}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="P&L Thực tế - Lý thuyết">
          <ActualVsTheoreticalChart data={avt} />
        </Panel>
        <Panel title="Drawdown (Underwater Equity)" info="Khoảng cách giữa vốn hiện tại và đỉnh vốn gần nhất theo thời gian">
          <DrawdownChart data={drawdown} />
        </Panel>
      </div>

      <Panel title="Theo chiến lược / Playbook">
        <div className="space-y-2">
          {byStrategy?.map((s) => (
            <div key={s.strategy} className="flex items-center gap-2 text-xs">
              <span className="w-32 shrink-0 truncate font-medium text-gray-600" title={s.strategy}>
                {s.strategy}
              </span>
              <div className="relative h-2.5 flex-1 rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${s.netProfit >= 0 ? "bg-brand" : "bg-loss"}`}
                  style={{ width: `${(Math.abs(s.netProfit) / maxStrategy) * 100}%` }}
                />
              </div>
              <span className="w-14 shrink-0 text-right text-gray-400">{s.trades} lệnh</span>
              <span className="w-12 shrink-0 text-right text-gray-400">{formatPercent(s.winRate)}</span>
              <span className={`w-20 shrink-0 text-right font-semibold ${s.netProfit >= 0 ? "text-brand" : "text-loss"}`}>
                {formatCurrency(s.netProfit)}
              </span>
            </div>
          ))}
          {!byStrategy?.length && <p className="text-xs text-gray-400">Chưa gắn chiến lược cho lệnh nào.</p>}
        </div>
      </Panel>
    </div>
  );
}
