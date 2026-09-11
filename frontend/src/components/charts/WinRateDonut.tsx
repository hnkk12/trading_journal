import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

export default function WinRateDonut({
  winRate,
  total,
  won,
  lost,
}: {
  winRate: number; // 0..1
  total: number;
  won: number;
  lost: number;
}) {
  const pct = Math.round(winRate * 1000) / 10;
  const color = pct >= 60 ? "#0f9d6a" : pct >= 45 ? "#d97706" : "#e53e5c";
  const data = [
    { name: "win", value: pct },
    { name: "rest", value: 100 - pct },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[180px] w-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={62} outerRadius={82} startAngle={90} endAngle={-270} isAnimationActive={false}>
              <Cell fill={color} />
              <Cell fill="#e5e7eb" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{pct}</span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Win Rate%</span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-gray-900">{total}</div>
          <div className="text-[11px] text-gray-400">Tổng lệnh</div>
        </div>
        <div>
          <div className="text-lg font-bold text-brand">{won}</div>
          <div className="text-[11px] text-gray-400">Lệnh thắng</div>
        </div>
        <div>
          <div className="text-lg font-bold text-loss">{lost}</div>
          <div className="text-[11px] text-gray-400">Lệnh thua</div>
        </div>
      </div>
    </div>
  );
}
