import { useFilters } from "../../store/filterContext";
import { useAccounts } from "../../api/hooks";
import { useTradeModal } from "../../store/tradeModalContext";

function lastMonths(n: number): { value: string; label: string }[] {
  const out = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ value, label: `Tháng ${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}` });
  }
  return out;
}

function recentWeeks(n: number): { value: string; label: string }[] {
  const out = [];
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  for (let i = 0; i < n; i++) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - i * 7);
    const value = start.toISOString().slice(0, 10);
    out.push({ value, label: `Tuần ${value}` });
  }
  return out;
}

export default function FilterBar() {
  const { accountId, month, week, setAccountId, setMonth, setWeek } = useFilters();
  const { data: accounts } = useAccounts();
  const { openCreate } = useTradeModal();
  const months = lastMonths(12);
  const weeks = recentWeeks(12);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
      >
        <option value="">Tất cả tài khoản</option>
        {accounts?.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <select
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      >
        <option value="">Tất cả tháng</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm"
        value={week}
        onChange={(e) => setWeek(e.target.value)}
      >
        <option value="">Tất cả tuần</option>
        {weeks.map((w) => (
          <option key={w.value} value={w.value}>
            {w.label}
          </option>
        ))}
      </select>
      <button
        onClick={openCreate}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
      >
        + Thêm Lệnh
      </button>
    </div>
  );
}
