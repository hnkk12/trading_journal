import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ActualVsTheoreticalPoint } from "../../types";
import { formatPlainCurrency } from "../../utils/format";

export default function ActualVsTheoreticalChart({ data }: { data?: ActualVsTheoreticalPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data ?? []} margin={{ left: -10, right: 10, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f4" />
        <XAxis
          dataKey="index"
          tickFormatter={(v) => `#${v}`}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60} />
        <Tooltip formatter={(v: number) => formatPlainCurrency(v)} />
        <Legend
          formatter={(v) => (v === "actual" ? "Thực tế" : "Lý thuyết")}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Line type="monotone" dataKey="theoretical" stroke="#e53e5c" strokeWidth={2} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="actual" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
