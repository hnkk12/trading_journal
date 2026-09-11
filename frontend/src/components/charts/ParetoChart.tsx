import { Bar, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CommonError } from "../../types";

const SEVERITY_COLOR: Record<number, string> = { 1: "#60a5fa", 2: "#f97316", 3: "#e53e5c" };

export default function ParetoChart({ data }: { data?: CommonError[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data ?? []} margin={{ left: -10, right: 10, top: 10 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={60}
          axisLine={false}
          tickLine={false}
        />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip />
        <Bar yAxisId="left" dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {(data ?? []).map((d, i) => (
            <Cell key={i} fill={SEVERITY_COLOR[d.severity] ?? "#e53e5c"} />
          ))}
        </Bar>
        <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" stroke="#f59e0b" strokeWidth={2} dot isAnimationActive={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
