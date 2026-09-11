import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DrawdownPoint } from "../../types";
import { formatPlainCurrency } from "../../utils/format";

export default function DrawdownChart({ data }: { data?: DrawdownPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data ?? []} margin={{ left: -10, right: 10, top: 10 }}>
        <defs>
          <linearGradient id="ddFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e53e5c" stopOpacity={0} />
            <stop offset="100%" stopColor="#e53e5c" stopOpacity={0.35} />
          </linearGradient>
        </defs>
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
        <Area type="monotone" dataKey="drawdown" stroke="#e53e5c" strokeWidth={2} fill="url(#ddFill)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
