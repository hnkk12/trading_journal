export function formatCurrency(value: number, currency = "USD"): string {
  const sign = value < 0 ? "-" : "+";
  const abs = Math.abs(value);
  return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatPlainCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export const ASSET_CLASS_LABEL: Record<string, string> = {
  stock: "Cổ phiếu",
  crypto: "Crypto",
  forex: "Forex",
  futures: "Futures",
};

export const SESSION_LABEL: Record<string, string> = {
  sydney: "Sydney",
  tokyo: "Tokyo",
  london: "London",
  newyork: "New York",
  unknown: "Không rõ",
};
