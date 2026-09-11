import { useFilters } from "../store/filterContext";
import { useCommonErrors, useExecutionSummary, useTradeMatrix } from "../api/hooks";
import Panel from "../components/cards/Panel";
import ExecutionRadar from "../components/charts/ExecutionRadar";
import TradeMatrixGrid from "../components/charts/TradeMatrixGrid";
import ParetoChart from "../components/charts/ParetoChart";

const GRADE_COLOR: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-700",
  B: "bg-sky-100 text-sky-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-orange-100 text-orange-700",
  F: "bg-rose-100 text-rose-700",
  "N/A": "bg-gray-100 text-gray-500",
};

export default function Execution() {
  const filters = useFilters();
  const { data: execution } = useExecutionSummary(filters);
  const { data: matrix } = useTradeMatrix(filters);
  const { data: errors } = useCommonErrors(filters);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Panel title={`Điểm thực thi tổng thể · trung bình (${execution?.tradeCount ?? 0} lệnh)`}>
        <ExecutionRadar data={execution} />
        <div className="mt-2 flex items-center gap-3">
          <span className="text-3xl font-bold text-gray-900">{execution?.total ?? 0}</span>
          <span className="text-sm text-gray-400">/100</span>
          <span className={`ml-auto rounded-md px-2 py-1 text-sm font-bold ${GRADE_COLOR[execution?.grade ?? "N/A"]}`}>
            {execution?.grade ?? "N/A"}
          </span>
        </div>
        <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
          {execution?.stages.map((s) => (
            <div key={s.key} className="flex items-center justify-between">
              <span className="text-gray-500">{s.label}</span>
              <span className="font-semibold text-gray-800">
                {s.score} <span className="text-xs font-normal text-gray-400">/ {s.max}</span>
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Ma trận 4 nhóm lệnh"
        info="Framework tâm lý giao dịch: phân biệt lợi nhuận đến từ kỹ năng hay từ may mắn"
        className="xl:col-span-2"
      >
        <TradeMatrixGrid data={matrix} />
      </Panel>

      <Panel title="Lỗi hay gặp nhất" className="xl:col-span-3">
        <ParetoChart data={errors} />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {errors?.map((e) => (
            <div key={e.name} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
                    e.severity === 3 ? "bg-loss" : e.severity === 2 ? "bg-amber-500" : "bg-sky-500"
                  }`}
                >
                  Mức {e.severity}
                </span>
                {e.name}
              </span>
              <span className="font-semibold text-gray-800">{e.count}x</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
