import { useMemo, useState } from "react";
import { useFilters } from "../store/filterContext";
import { useDailyPnl } from "../api/hooks";
import Panel from "../components/cards/Panel";
import { formatCurrency, formatPlainCurrency } from "../utils/format";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function intensity(net: number, maxAbs: number) {
  if (maxAbs === 0) return 0.15;
  return Math.min(1, Math.max(0.18, Math.abs(net) / maxAbs));
}

export default function CalendarPage() {
  const filters = useFilters();
  const { data: daily } = useDailyPnl(filters);
  const [viewDate, setViewDate] = useState(() => new Date());

  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of daily ?? []) map.set(d.date, d.net);
    return map;
  }, [daily]);

  const maxAbs = useMemo(() => Math.max(1, ...(daily ?? []).map((d) => Math.abs(d.net))), [daily]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthTotal = Array.from({ length: daysInMonth }, (_, i) => {
    const key = new Date(year, month, i + 1).toISOString().slice(0, 10);
    return byDate.get(key) ?? 0;
  }).reduce((a, b) => a + b, 0);
  const tradingDays = Array.from({ length: daysInMonth }, (_, i) => {
    const key = new Date(year, month, i + 1).toISOString().slice(0, 10);
    return byDate.has(key);
  }).filter(Boolean).length;

  return (
    <Panel
      title={`Lịch P&L — Tháng ${month + 1}/${year}`}
      right={
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${monthTotal >= 0 ? "text-brand" : "text-loss"}`}>
            {formatCurrency(monthTotal)} · {tradingDays} ngày giao dịch
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
            >
              ← Trước
            </button>
            <button
              onClick={() => setViewDate(new Date())}
              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
            >
              Hôm nay
            </button>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
            >
              Sau →
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-medium text-gray-400">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="aspect-square rounded-lg bg-transparent" />;
          const key = date.toISOString().slice(0, 10);
          const net = byDate.get(key);
          const hasTrade = net !== undefined;
          const isToday = key === new Date().toISOString().slice(0, 10);
          const bg = !hasTrade
            ? "bg-gray-50"
            : net! >= 0
            ? `rgba(15,157,106,${intensity(net!, maxAbs)})`
            : `rgba(229,62,92,${intensity(net!, maxAbs)})`;
          return (
            <div
              key={i}
              className={`flex aspect-square flex-col justify-between rounded-lg p-1.5 text-left ${
                !hasTrade ? "bg-gray-50" : ""
              } ${isToday ? "ring-2 ring-brand" : ""}`}
              style={hasTrade ? { background: bg } : undefined}
            >
              <span className={`text-[11px] font-medium ${hasTrade ? "text-white/90" : "text-gray-400"}`}>
                {date.getDate()}
              </span>
              {hasTrade && (
                <span className="text-[11px] font-bold text-white">{formatPlainCurrency(net!)}</span>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
