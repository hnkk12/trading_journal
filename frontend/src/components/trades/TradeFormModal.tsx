import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useAccounts, useCreateTrade, useDeleteTrade, useErrorTags, useTrades, useUpdateTrade } from "../../api/hooks";
import { useTradeModal } from "../../store/tradeModalContext";
import { AssetClass, Direction, TradeStatus } from "../../types";

interface FormValues {
  accountId: string;
  symbol: string;
  assetClass: AssetClass;
  direction: Direction;
  entryPrice: number;
  exitPrice: number | "";
  quantity: number;
  entryTime: string;
  exitTime: string;
  stopLoss: number | "";
  takeProfit: number | "";
  fees: number;
  status: TradeStatus;
  timeframe: string;
  followedPlan: boolean;
  strategy: string;
  notes: string;
  beforeScore: number;
  duringScore: number;
  afterScore: number;
  disciplineScore: number;
  errorTagIds: string[];
}

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

export default function TradeFormModal() {
  const { isOpen, editingTrade, close } = useTradeModal();
  const { data: accounts } = useAccounts();
  const { data: errorTags } = useErrorTags();
  const { data: allTrades } = useTrades({});
  const strategyOptions = useMemo(
    () => Array.from(new Set((allTrades ?? []).map((t) => t.strategy).filter((s): s is string => !!s))).sort(),
    [allTrades]
  );
  const createTrade = useCreateTrade();
  const updateTrade = useUpdateTrade();
  const deleteTrade = useDeleteTrade();

  const { register, handleSubmit, watch, reset, setValue } = useForm<FormValues>({
    defaultValues: {
      accountId: "",
      symbol: "",
      assetClass: "forex",
      direction: "long",
      entryPrice: 0,
      exitPrice: "",
      quantity: 1,
      entryTime: toLocalInput(new Date().toISOString()),
      exitTime: "",
      stopLoss: "",
      takeProfit: "",
      fees: 0,
      status: "open",
      timeframe: "H1",
      followedPlan: true,
      strategy: "",
      notes: "",
      beforeScore: 0,
      duringScore: 0,
      afterScore: 0,
      disciplineScore: 0,
      errorTagIds: [],
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (editingTrade) {
      reset({
        accountId: editingTrade.accountId,
        symbol: editingTrade.symbol,
        assetClass: editingTrade.assetClass,
        direction: editingTrade.direction,
        entryPrice: editingTrade.entryPrice,
        exitPrice: editingTrade.exitPrice ?? "",
        quantity: editingTrade.quantity,
        entryTime: toLocalInput(editingTrade.entryTime),
        exitTime: toLocalInput(editingTrade.exitTime),
        stopLoss: editingTrade.stopLoss ?? "",
        takeProfit: editingTrade.takeProfit ?? "",
        fees: editingTrade.fees,
        status: editingTrade.status,
        timeframe: editingTrade.timeframe ?? "H1",
        followedPlan: editingTrade.followedPlan,
        strategy: editingTrade.strategy ?? "",
        notes: editingTrade.notes ?? "",
        beforeScore: editingTrade.executionScore?.beforeScore ?? 0,
        duringScore: editingTrade.executionScore?.duringScore ?? 0,
        afterScore: editingTrade.executionScore?.afterScore ?? 0,
        disciplineScore: editingTrade.executionScore?.disciplineScore ?? 0,
        errorTagIds: editingTrade.errorTags?.map((t) => t.errorTag.id) ?? [],
      });
    } else {
      reset({
        accountId: accounts?.[0]?.id ?? "",
        symbol: "",
        assetClass: accounts?.[0]?.assetClass ?? "forex",
        direction: "long",
        entryPrice: 0,
        exitPrice: "",
        quantity: 1,
        entryTime: toLocalInput(new Date().toISOString()),
        exitTime: "",
        stopLoss: "",
        takeProfit: "",
        fees: 0,
        status: "open",
        timeframe: "H1",
        followedPlan: true,
        notes: "",
        beforeScore: 0,
        duringScore: 0,
        afterScore: 0,
        disciplineScore: 0,
        errorTagIds: [],
      });
    }
  }, [isOpen, editingTrade, accounts, reset]);

  if (!isOpen) return null;

  const selectedErrorTags = watch("errorTagIds");

  function toggleErrorTag(id: string) {
    const current = selectedErrorTags ?? [];
    setValue("errorTagIds", current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      accountId: values.accountId,
      symbol: values.symbol.toUpperCase(),
      assetClass: values.assetClass,
      direction: values.direction,
      entryPrice: Number(values.entryPrice),
      exitPrice: values.exitPrice === "" ? null : Number(values.exitPrice),
      quantity: Number(values.quantity),
      entryTime: new Date(values.entryTime).toISOString(),
      exitTime: values.exitTime ? new Date(values.exitTime).toISOString() : null,
      stopLoss: values.stopLoss === "" ? null : Number(values.stopLoss),
      takeProfit: values.takeProfit === "" ? null : Number(values.takeProfit),
      fees: Number(values.fees),
      status: values.status,
      timeframe: values.timeframe,
      followedPlan: values.followedPlan,
      strategy: values.strategy || undefined,
      notes: values.notes,
      executionScore: {
        beforeScore: Number(values.beforeScore),
        duringScore: Number(values.duringScore),
        afterScore: Number(values.afterScore),
        disciplineScore: Number(values.disciplineScore),
      },
      errorTagIds: values.errorTagIds,
    };
    if (editingTrade) {
      await updateTrade.mutateAsync({ id: editingTrade.id, data: payload });
    } else {
      await createTrade.mutateAsync(payload);
    }
    close();
  }

  async function onDelete() {
    if (!editingTrade) return;
    if (!confirm("Xoá lệnh này?")) return;
    await deleteTrade.mutateAsync(editingTrade.id);
    close();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{editingTrade ? "Sửa lệnh" : "Thêm lệnh"}</h2>
          <button onClick={close} className="text-gray-400 hover:text-gray-700">
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Tài khoản">
              <select {...register("accountId", { required: true })} className="tj-input">
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Loại tài sản">
              <select {...register("assetClass")} className="tj-input">
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="stock">Cổ phiếu</option>
                <option value="futures">Futures</option>
              </select>
            </Field>
            <Field label="Mã">
              <input {...register("symbol", { required: true })} className="tj-input" placeholder="EURUSD" />
            </Field>
            <Field label="Hướng">
              <select {...register("direction")} className="tj-input">
                <option value="long">Long / Buy</option>
                <option value="short">Short / Sell</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Giá vào">
              <input type="number" step="any" {...register("entryPrice", { required: true, valueAsNumber: true })} className="tj-input" />
            </Field>
            <Field label="Giá ra">
              <input type="number" step="any" {...register("exitPrice", { setValueAs: (v) => (v === "" ? "" : Number(v)) })} className="tj-input" />
            </Field>
            <Field label="Khối lượng">
              <input type="number" step="any" {...register("quantity", { required: true, valueAsNumber: true })} className="tj-input" />
            </Field>
            <Field label="Phí ($)">
              <input type="number" step="any" {...register("fees", { valueAsNumber: true })} className="tj-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Stop Loss">
              <input type="number" step="any" {...register("stopLoss", { setValueAs: (v) => (v === "" ? "" : Number(v)) })} className="tj-input" />
            </Field>
            <Field label="Take Profit">
              <input type="number" step="any" {...register("takeProfit", { setValueAs: (v) => (v === "" ? "" : Number(v)) })} className="tj-input" />
            </Field>
            <Field label="Khung giờ">
              <select {...register("timeframe")} className="tj-input">
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Trạng thái">
              <select {...register("status")} className="tj-input">
                <option value="open">Đang mở</option>
                <option value="closed">Đã đóng</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Thời gian vào lệnh">
              <input type="datetime-local" {...register("entryTime", { required: true })} className="tj-input" />
            </Field>
            <Field label="Thời gian thoát lệnh">
              <input type="datetime-local" {...register("exitTime")} className="tj-input" />
            </Field>
          </div>

          <Field label="Chiến lược / Playbook">
            <input {...register("strategy")} list="strategy-options" className="tj-input" placeholder="Breakout, Pullback, ICT..." />
            <datalist id="strategy-options">
              {strategyOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <input type="checkbox" {...register("followedPlan")} className="h-4 w-4 rounded border-gray-300 text-brand" />
            Giao dịch theo đúng kế hoạch
          </label>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Thang điểm thực thi lệnh</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Trước lệnh (/25)">
                <input type="number" min={0} max={25} {...register("beforeScore", { valueAsNumber: true })} className="tj-input" />
              </Field>
              <Field label="Trong lệnh (/35)">
                <input type="number" min={0} max={35} {...register("duringScore", { valueAsNumber: true })} className="tj-input" />
              </Field>
              <Field label="Sau lệnh (/20)">
                <input type="number" min={0} max={20} {...register("afterScore", { valueAsNumber: true })} className="tj-input" />
              </Field>
              <Field label="Kỷ luật (/20)">
                <input type="number" min={0} max={20} {...register("disciplineScore", { valueAsNumber: true })} className="tj-input" />
              </Field>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Lỗi mắc phải (nếu có)</p>
            <div className="flex flex-wrap gap-2">
              {errorTags?.map((tag) => (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => toggleErrorTag(tag.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    selectedErrorTags?.includes(tag.id)
                      ? "border-loss bg-rose-50 text-loss"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <Field label="Ghi chú">
            <textarea {...register("notes")} rows={3} className="tj-input" />
          </Field>

          <div className="flex items-center justify-between pt-2">
            <div>
              {editingTrade && (
                <button type="button" onClick={onDelete} className="text-sm font-medium text-loss hover:underline">
                  Xoá lệnh
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={close} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600">
                Huỷ
              </button>
              <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                {editingTrade ? "Lưu thay đổi" : "Thêm lệnh"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      {children}
    </label>
  );
}
