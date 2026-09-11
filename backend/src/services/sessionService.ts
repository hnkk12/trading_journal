// Standard forex session windows in UTC hours (start inclusive, end exclusive).
// Sydney and Tokyo wrap differently than London/New York but all are expressed as [start, end) in UTC.
export const SESSION_WINDOWS: Record<string, { startUTC: number; endUTC: number }> = {
  sydney: { startUTC: 22, endUTC: 7 }, // wraps midnight
  tokyo: { startUTC: 0, endUTC: 9 },
  london: { startUTC: 8, endUTC: 17 },
  newyork: { startUTC: 13, endUTC: 22 },
};

function isWithinWindow(hourUTC: number, startUTC: number, endUTC: number): boolean {
  if (startUTC < endUTC) {
    return hourUTC >= startUTC && hourUTC < endUTC;
  }
  // wraps past midnight (e.g. Sydney 22 -> 7)
  return hourUTC >= startUTC || hourUTC < endUTC;
}

export function getOpenSessions(date: Date = new Date()): string[] {
  const hourUTC = date.getUTCHours();
  return Object.entries(SESSION_WINDOWS)
    .filter(([, w]) => isWithinWindow(hourUTC, w.startUTC, w.endUTC))
    .map(([name]) => name);
}

// Priority order used when a trade's entry time falls into more than one open session
// (overlaps happen e.g. London/New York) — pick the "primary" session by convention.
const SESSION_PRIORITY = ["london", "newyork", "tokyo", "sydney"];

export function deriveSessionFromTime(date: Date): string {
  const open = getOpenSessions(date);
  if (open.length === 0) return "unknown";
  for (const s of SESSION_PRIORITY) {
    if (open.includes(s)) return s;
  }
  return open[0];
}

export function sessionTimelineData(now: Date = new Date()) {
  return Object.entries(SESSION_WINDOWS).map(([name, w]) => ({
    name,
    startUTC: w.startUTC,
    endUTC: w.endUTC,
    isOpen: getOpenSessions(now).includes(name),
  }));
}
