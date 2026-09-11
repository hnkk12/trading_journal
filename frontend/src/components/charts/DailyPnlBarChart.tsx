import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DailyPnlPoint } from "../../types";
import { formatPlainCurrency } from "../../utils/format";

export default function DailyPnlBarChart({ data }: { data?: DailyPnlPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data ?? []} margin={{ left: -10, right: 10, top: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef1f4" />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => d.slice(5)}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60} />
        <Tooltip formatter={(v: number) => formatPlainCurrency(v)} labelFormatter={(l) => `Ngày ${l}`} />
        <Bar dataKey="net" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {(data ?? []).map((d, i) => (
            <Cell key={i} fill={d.net >= 0 ? "#0f9d6a" : "#e53e5c"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
