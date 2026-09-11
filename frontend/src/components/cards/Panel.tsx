import { ReactNode } from "react";

export default function Panel({ title, info, right, children, className }: { title?: string; info?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${className ?? ""}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {title}
            {info && <span title={info} className="text-gray-300">ⓘ</span>}
          </h3>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
