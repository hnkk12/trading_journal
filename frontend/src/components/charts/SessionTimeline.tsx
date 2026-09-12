import { useSessionTimeline } from "../../api/hooks";
import { SESSION_LABEL } from "../../utils/format";

const ORDER = ["sydney", "tokyo", "london", "newyork"];

function segments(startUTC: number, endUTC: number): { from: number; to: number }[] {
  if (startUTC < endUTC) return [{ from: startUTC, to: endUTC }];
  return [
    { from: startUTC, to: 24 },
    { from: 0, to: endUTC },
  ];
}

export default function SessionTimeline() {
  const { data } = useSessionTimeline();
  const now = new Date();
  const nowPct = ((now.getUTCHours() + now.getUTCMinutes() / 60) / 24) * 100;
  const rows = ORDER.map((name) => data?.find((d) => d.name === name)).filter(Boolean) as NonNullable<
    typeof data
  >;
  const openNames = rows.filter((r) => r.isOpen).map((r) => SESSION_LABEL[r.name]);

  return (
    <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm">
      <div className="relative">
        {[...Array(9)].map((_, i) => (
          <span
            key={i}
            className="absolute top-0 -translate-x-1/2 text-[10px] text-gray-300"
            style={{ left: `${(i / 8) * 100}%` }}
          >
            {i * 3}h
          </span>
        ))}
        <div className="mt-4 space-y-2 pt-2">
          {rows.map((row) => (
            <div key={row.name} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs font-medium text-gray-500">{SESSION_LABEL[row.name]}</span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                {segments(row.startUTC, row.endUTC).map((seg, i) => (
                  <div
                    key={i}
                    className={`absolute top-0 h-full rounded-full ${row.isOpen ? "bg-brand" : "bg-rose-200"}`}
                    style={{ left: `${(seg.from / 24) * 100}%`, width: `${((seg.to - seg.from) / 24) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-6 bottom-0" style={{ left: `${nowPct}%` }}>
          <div className="h-full w-px bg-gray-800/60" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <div>
          <span className="text-gray-400">Đang mở: </span>
          {openNames.length ? (
            openNames.map((n) => (
              <span key={n} className="mr-1 rounded-full bg-brand-light px-2 py-0.5 font-medium text-brand-dark">
                {n}
              </span>
            ))
          ) : (
            <span className="text-gray-400">Không có phiên nào</span>
          )}
        </div>
      </div>
    </div>
  );
}
