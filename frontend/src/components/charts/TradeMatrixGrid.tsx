import { TradeMatrixBucket } from "../../types";
import { formatCurrency } from "../../utils/format";

const STYLES: Record<string, { bg: string; border: string; text: string; desc: string }> = {
  plan_win: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    desc: "Đúng quy trình, đúng kết quả. Đây là lợi nhuận thật sự đến từ kỹ năng — hãy tin vào nó.",
  },
  plan_loss: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-700",
    desc: "Làm đúng nhưng vẫn thua — bình thường, là 1 phần của cuộc chơi. Không cần tự trách nếu tiến trình đã đúng.",
  },
  impulse_loss: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    desc: "Quyết định chất lượng thấp, và trả giá đúng như dự đoán. Đây là nhóm cần giảm thiểu nhiều nhất.",
  },
  impulse_win: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    desc: "Nguy hiểm nhất: quyết định sai nhưng vẫn có lãi. Dễ ngộ nhận là giỏi — dễ nghiện cũng gặp lại drawdown lớn.",
  },
};

export default function TradeMatrixGrid({ data }: { data?: TradeMatrixBucket[] }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {data.map((bucket) => {
        const style = STYLES[bucket.key];
        return (
          <div key={bucket.key} className={`rounded-lg border p-3 ${style.bg} ${style.border}`}>
            <div className={`text-xs font-semibold ${style.text}`}>{bucket.label.toUpperCase()}</div>
            <div className={`mt-1 text-2xl font-bold ${style.text}`}>
              {bucket.count} <span className="text-sm font-medium">lệnh ({bucket.percent}%)</span>
            </div>
            <div className={`text-sm font-semibold ${bucket.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(bucket.netProfit)}
            </div>
            <p className="mt-1 text-[11px] leading-snug text-gray-500">{style.desc}</p>
          </div>
        );
      })}
    </div>
  );
}
