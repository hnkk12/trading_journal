import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { ExecutionSummary } from "../../types";

export default function ExecutionRadar({ data }: { data?: ExecutionSummary }) {
  if (!data) return null;
  const chartData = [
    { axis: "Trước lệnh", value: (data.stages[0].score / data.stages[0].max) * 100 },
    { axis: "Trong lệnh", value: (data.stages[1].score / data.stages[1].max) * 100 },
    { axis: "Sau lệnh", value: (data.stages[2].score / data.stages[2].max) * 100 },
    { axis: "Kỷ luật", value: (data.stages[3].score / data.stages[3].max) * 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={chartData} outerRadius="70%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#6b7280" }} />
        <Radar dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.35} isAnimationActive={false} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
