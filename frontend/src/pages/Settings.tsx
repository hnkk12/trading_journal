import { FormEvent, useState } from "react";
import {
  useAccounts,
  useCreateAccount,
  useCreateErrorTag,
  useCreateTransaction,
  useDeleteAccount,
  useErrorTags,
  useTransactions,
} from "../api/hooks";
import Panel from "../components/cards/Panel";
import { AssetClass, MarketType } from "../types";
import { ASSET_CLASS_LABEL, formatPlainCurrency } from "../utils/format";

export default function Settings() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <AccountsPanel />
      <TransactionsPanel />
      <ErrorTagsPanel />
    </div>
  );
}

function AccountsPanel() {
  const { data: accounts } = useAccounts();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();
  const [form, setForm] = useState({
    name: "",
    broker: "",
    assetClass: "forex" as AssetClass,
    marketType: "spot" as MarketType,
    currency: "USD",
    initialBalance: 0,
    riskPerTradeAmount: 0,
    riskPerTradePercent: 1,
    leverage: 1,
    maintenanceMarginRate: 0.005,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    await createAccount.mutateAsync(form);
    setForm({ ...form, name: "", broker: "" });
  }

  return (
    <Panel title="Tài khoản">
      <div className="space-y-2">
        {accounts?.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
            <div>
              <p className="font-semibold text-gray-800">{a.name}</p>
              <p className="text-xs text-gray-400">
                {ASSET_CLASS_LABEL[a.assetClass]} · {a.marketType} · {formatPlainCurrency(a.initialBalance)} vốn ban đầu
                {a.marketType === "futures" && ` · Đòn bẩy x${a.leverage}`}
              </p>
            </div>
            <button
              onClick={() => confirm(`Xoá tài khoản ${a.name}?`) && deleteAccount.mutate(a.id)}
              className="text-xs font-medium text-loss hover:underline"
            >
              Xoá
            </button>
          </div>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Thêm tài khoản mới</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Tên tài khoản"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="tj-input"
          />
          <input
            placeholder="Broker/Sàn"
            value={form.broker}
            onChange={(e) => setForm({ ...form, broker: e.target.value })}
            className="tj-input"
          />
          <select
            value={form.assetClass}
            onChange={(e) => setForm({ ...form, assetClass: e.target.value as AssetClass })}
            className="tj-input"
          >
            <option value="forex">Forex</option>
            <option value="crypto">Crypto</option>
            <option value="stock">Cổ phiếu</option>
            <option value="futures">Futures</option>
          </select>
          <select
            value={form.marketType}
            onChange={(e) => setForm({ ...form, marketType: e.target.value as MarketType })}
            className="tj-input"
          >
            <option value="spot">Spot</option>
            <option value="futures">Futures</option>
          </select>
          <input
            type="number"
            placeholder="Vốn ban đầu"
            value={form.initialBalance}
            onChange={(e) => setForm({ ...form, initialBalance: Number(e.target.value) })}
            className="tj-input"
          />
          <input
            type="number"
            placeholder="Rủi ro/lệnh ($)"
            value={form.riskPerTradeAmount}
            onChange={(e) => setForm({ ...form, riskPerTradeAmount: Number(e.target.value) })}
            className="tj-input"
          />
          {form.marketType === "futures" && (
            <>
              <input
                type="number"
                min={1}
                step="any"
                placeholder="Đòn bẩy (x)"
                value={form.leverage}
                onChange={(e) => setForm({ ...form, leverage: Number(e.target.value) })}
                className="tj-input"
              />
              <input
                type="number"
                min={0}
                max={1}
                step="any"
                placeholder="Maintenance margin rate (vd 0.005)"
                value={form.maintenanceMarginRate}
                onChange={(e) => setForm({ ...form, maintenanceMarginRate: Number(e.target.value) })}
                className="tj-input"
              />
            </>
          )}
        </div>
        <button type="submit" className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          Thêm tài khoản
        </button>
      </form>
    </Panel>
  );
}

function TransactionsPanel() {
  const { data: accounts } = useAccounts();
  const { data: transactions } = useTransactions();
  const createTx = useCreateTransaction();
  const [form, setForm] = useState({ accountId: "", type: "deposit" as "deposit" | "withdraw", amount: 0, note: "" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.accountId || !form.amount) return;
    await createTx.mutateAsync({ ...form, date: new Date().toISOString() });
    setForm({ ...form, amount: 0, note: "" });
  }

  return (
    <Panel title="Nạp / Rút tiền">
      <div className="max-h-56 space-y-1.5 overflow-y-auto">
        {transactions?.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{new Date(tx.date).toLocaleDateString("vi-VN")}</span>
            <span className={tx.type === "deposit" ? "text-brand" : "text-loss"}>
              {tx.type === "deposit" ? "Nạp" : "Rút"} {formatPlainCurrency(tx.amount)}
            </span>
          </div>
        ))}
        {!transactions?.length && <p className="text-xs text-gray-400">Chưa có giao dịch nạp/rút.</p>}
      </div>
      <form onSubmit={onSubmit} className="mt-4 space-y-2 border-t border-gray-100 pt-4">
        <div className="grid grid-cols-3 gap-2">
          <select
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            className="tj-input col-span-1"
          >
            <option value="">Tài khoản</option>
            {accounts?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as "deposit" | "withdraw" })}
            className="tj-input"
          >
            <option value="deposit">Nạp tiền</option>
            <option value="withdraw">Rút tiền</option>
          </select>
          <input
            type="number"
            placeholder="Số tiền"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            className="tj-input"
          />
        </div>
        <button type="submit" className="w-full rounded-lg bg-brand py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          Ghi nhận giao dịch
        </button>
      </form>
    </Panel>
  );
}

function ErrorTagsPanel() {
  const { data: tags } = useErrorTags();
  const createTag = useCreateErrorTag();
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState(1);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    await createTag.mutateAsync({ name, severity });
    setName("");
  }

  return (
    <Panel title="Danh sách lỗi thường gặp" className="xl:col-span-2">
      <div className="flex flex-wrap gap-2">
        {tags?.map((t) => (
          <span
            key={t.id}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              t.severity === 3 ? "bg-rose-50 text-loss" : t.severity === 2 ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"
            }`}
          >
            {t.name} · Mức {t.severity}
          </span>
        ))}
      </div>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
        <input placeholder="Tên lỗi mới" value={name} onChange={(e) => setName(e.target.value)} className="tj-input flex-1" />
        <select value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="tj-input w-32">
          <option value={1}>Mức 1</option>
          <option value={2}>Mức 2</option>
          <option value={3}>Mức 3</option>
        </select>
        <button type="submit" className="rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          Thêm
        </button>
      </form>
    </Panel>
  );
}
