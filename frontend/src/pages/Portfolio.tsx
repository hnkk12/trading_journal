import { useState } from "react";
import { usePortfolio } from "../api/hooks";
import Panel from "../components/cards/Panel";
import StatCard from "../components/cards/StatCard";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ASSET_CLASS_LABEL, cn, formatNumber, formatPlainCurrency } from "../utils/format";
import { AssetClass } from "../types";

const COLORS: Record<AssetClass, string> = {
  forex: "#0f9d6a",
  crypto: "#f59e0b",
  stock: "#3b82f6",
  futures: "#a855f7",
};

const TABS: { key: AssetClass | "all"; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "forex", label: "Forex" },
  { key: "crypto", label: "Crypto" },
  { key: "stock", label: "Cổ phiếu" },
  { key: "futures", label: "Futures" },
];

export default function Portfolio() {
  const { data } = usePortfolio();
  const [tab, setTab] = useState<AssetClass | "all">("all");

  const accounts = data?.accounts.filter((a) => tab === "all" || a.assetClass === tab) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              tab === t.key ? "bg-brand text-white" : "bg-white text-gray-500 hover:bg-gray-100"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StatCard label="Tổng số dư danh mục" value={data ? formatPlainCurrency(data.totalBalance) : "—"} valueClassName="text-brand" />
        <Panel title="Phân bổ theo loại tài sản" className="lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="h-[140px] w-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.allocation ?? []}
                    dataKey="balance"
                    nameKey="assetClass"
                    innerRadius={40}
                    outerRadius={65}
                    isAnimationActive={false}
                  >
                    {(data?.allocation ?? []).map((a) => (
                      <Cell key={a.assetClass} fill={COLORS[a.assetClass]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatPlainCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {data?.allocation.map((a) => (
                <div key={a.assetClass} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[a.assetClass] }} />
                    {ASSET_CLASS_LABEL[a.assetClass]} ({a.accounts} TK)
                  </span>
                  <span className="font-semibold text-gray-800">
                    {formatPlainCurrency(a.balance)} · {a.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {accounts.map((acc) => (
          <Panel key={acc.id} title={`${acc.name} · ${ASSET_CLASS_LABEL[acc.assetClass]} (${acc.marketType === "spot" ? "Spot" : "Futures"})`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatPlainCurrency(acc.balance)}</p>
                <p className="text-xs text-gray-400">{acc.broker ?? "—"}</p>
              </div>
              <div className={`text-sm font-semibold ${acc.netTradePnl >= 0 ? "text-brand" : "text-loss"}`}>
                {acc.netTradePnl >= 0 ? "+" : ""}
                {formatPlainCurrency(acc.netTradePnl)}
              </div>
            </div>
            <div className="mt-3 flex gap-4 text-xs text-gray-400">
              <span>{acc.openCount} lệnh đang mở</span>
              <span>{acc.closedCount} lệnh đã đóng</span>
              {acc.marketType === "futures" && <span>Đòn bẩy x{acc.leverage}</span>}
            </div>
            {acc.positions.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                {acc.positions.map((p) => (
                  <div key={`${p.symbol}-${p.direction}`} className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">
                        {p.symbol}{" "}
                        <span className={p.direction === "long" ? "text-brand" : "text-loss"}>
                          {p.direction === "long" ? "Long" : "Short"}
                        </span>
                        {p.entryCount > 1 && (
                          <span className="ml-1 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-600">
                            DCA x{p.entryCount}
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-gray-600">{formatNumber(p.totalQuantity)} khối lượng</span>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-gray-500 sm:grid-cols-4">
                      <span>
                        Giá TB: <span className="font-medium text-gray-700">{formatNumber(p.avgEntryPrice)}</span>
                      </span>
                      <span>
                        Giá trị: <span className="font-medium text-gray-700">{formatPlainCurrency(p.notionalValue)}</span>
                      </span>
                      {p.margin != null && (
                        <span>
                          Margin: <span className="font-medium text-gray-700">{formatPlainCurrency(p.margin)}</span>
                        </span>
                      )}
                      {p.liquidationPrice != null && (
                        <span>
                          Giá thanh lý: <span className="font-medium text-loss">{formatNumber(p.liquidationPrice)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        ))}
        {accounts.length === 0 && (
          <p className="text-sm text-gray-400">Chưa có tài khoản nào trong nhóm tài sản này.</p>
        )}
      </div>
    </div>
  );
}
