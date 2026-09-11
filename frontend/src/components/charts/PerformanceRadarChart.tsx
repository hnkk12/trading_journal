import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { PerformanceRadar } from "../../types";

const LABELS: Record<keyof PerformanceRadar["axes"], string> = {
  profitFactor: "Profit Factor",
  avgWinLoss: "Avg Win/Loss",
  maxDrawdown: "Max Drawdown",
  winRate: "Win Rate",
  recovery: "Recovery",
  consistency: "Consistency",
};

export default function PerformanceRadarChart({ data }: { data?: PerformanceRadar }) {
  if (!data) return null;
  const chartData = (Object.keys(LABELS) as (keyof PerformanceRadar["axes"])[]).map((key) => ({
    axis: LABELS[key],
    value: data.axes[key],
  }));

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="font-semibold uppercase tracking-wide">Điểm hiệu suất</span>
        <span className="font-bold text-gray-700">{data.total} / 100</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={chartData} outerRadius="75%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "#6b7280" }} />
          <Radar dataKey="value" stroke="#e53e5c" fill="#e53e5c" fillOpacity={0.35} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
