import { useFilters } from "../store/filterContext";
import { useAccounts, useTrades } from "../api/hooks";
import { useTradeModal } from "../store/tradeModalContext";
import { formatCurrency, ASSET_CLASS_LABEL, SESSION_LABEL } from "../utils/format";
import Panel from "../components/cards/Panel";
import { Trade } from "../types";

function exportTradesCsv(trades: Trade[], accountName: (id: string) => string) {
  const headers = [
    "Ngày vào",
    "Tài khoản",
    "Mã",
    "Loại",
    "Hướng",
    "Giá vào",
    "Giá ra",
    "Khối lượng",
    "Phí",
    "PnL",
    "Phiên",
    "Khung",
    "Chiến lược",
    "Trạng thái",
    "Theo kế hoạch",
  ];
  const rows = trades.map((t) => [
    new Date(t.entryTime).toISOString(),
    accountName(t.accountId),
    t.symbol,
    ASSET_CLASS_LABEL[t.assetClass],
    t.direction,
    t.entryPrice,
    t.exitPrice ?? "",
    t.quantity,
    t.fees,
    (t.pnl - t.fees).toFixed(2),
    SESSION_LABEL[t.session] ?? t.session,
    t.timeframe ?? "",
    t.strategy ?? "",
    t.status,
    t.followedPlan ? "Có" : "Không",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Trades() {
  const filters = useFilters();
  const { data: trades, isLoading } = useTrades(filters);
  const { data: accounts } = useAccounts();
  const { openEdit } = useTradeModal();

  const accountName = (id: string) => accounts?.find((a) => a.id === id)?.name ?? "—";

  return (
    <Panel
      title={`Danh sách lệnh${trades ? ` (${trades.length})` : ""}`}
      right={
        <button
          onClick={() => trades && exportTradesCsv(trades, accountName)}
          disabled={!trades?.length}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          ⬇ Xuất CSV
        </button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400">
              <th className="py-2 pr-3">Ngày vào</th>
              <th className="py-2 pr-3">Tài khoản</th>
              <th className="py-2 pr-3">Mã</th>
              <th className="py-2 pr-3">Loại</th>
              <th className="py-2 pr-3">Hướng</th>
              <th className="py-2 pr-3">Phiên</th>
              <th className="py-2 pr-3">Khung</th>
              <th className="py-2 pr-3">Chiến lược</th>
              <th className="py-2 pr-3 text-right">Khối lượng</th>
              <th className="py-2 pr-3 text-right">PnL</th>
              <th className="py-2 pr-3">Trạng thái</th>
              <th className="py-2 pr-3">Kế hoạch</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={12} className="py-6 text-center text-gray-400">
                  Đang tải...
                </td>
              </tr>
            )}
            {!isLoading && trades?.length === 0 && (
              <tr>
                <td colSpan={12} className="py-6 text-center text-gray-400">
                  Chưa có lệnh nào. Bấm "+ Thêm Lệnh" để bắt đầu.
                </td>
              </tr>
            )}
            {trades?.map((t) => {
              const net = t.pnl - t.fees;
              return (
                <tr
                  key={t.id}
                  onClick={() => openEdit(t)}
                  className="cursor-pointer border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-2 pr-3 text-gray-500">{new Date(t.entryTime).toLocaleString("vi-VN")}</td>
                  <td className="py-2 pr-3">{accountName(t.accountId)}</td>
                  <td className="py-2 pr-3 font-semibold text-gray-800">{t.symbol}</td>
                  <td className="py-2 pr-3 text-gray-500">{ASSET_CLASS_LABEL[t.assetClass]}</td>
                  <td className="py-2 pr-3">
                    <span className={t.direction === "long" ? "text-brand" : "text-loss"}>
                      {t.direction === "long" ? "Long" : "Short"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-gray-500">{SESSION_LABEL[t.session]}</td>
                  <td className="py-2 pr-3 text-gray-500">{t.timeframe}</td>
                  <td className="py-2 pr-3 text-gray-500">{t.strategy ?? "—"}</td>
                  <td className="py-2 pr-3 text-right text-gray-600">{t.quantity}</td>
                  <td className={`py-2 pr-3 text-right font-semibold ${net >= 0 ? "text-brand" : "text-loss"}`}>
                    {formatCurrency(net)}
                  </td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        t.status === "open" ? "bg-sky-50 text-sky-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {t.status === "open" ? "Đang mở" : "Đã đóng"}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {t.followedPlan ? (
                      <span className="text-brand">✓</span>
                    ) : (
                      <span className="text-loss">✕</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
