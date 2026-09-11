import { ReactNode } from "react";
import { cn } from "../../utils/format";

interface StatCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  valueClassName?: string;
  info?: string;
}

export default function StatCard({ label, value, sub, valueClassName, info }: StatCardProps) {
  return (
    <div className="relative rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
      {info && (
        <span title={info} className="absolute right-2 top-2 text-[11px] text-gray-300">
          ⓘ
        </span>
      )}
      <div className={cn("text-2xl font-bold", valueClassName ?? "text-gray-900")}>{value}</div>
      {sub && <div className="mt-0.5 text-xs font-medium text-gray-400">{sub}</div>}
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</div>
    </div>
  );
}
