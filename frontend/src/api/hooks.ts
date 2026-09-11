import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import {
  Account,
  ActualVsTheoreticalPoint,
  BuySellStats,
  CommonError,
  DailyPnlPoint,
  DrawdownPoint,
  ErrorTag,
  ExecutionSummary,
  OverviewStats,
  PerformanceRadar,
  PortfolioResponse,
  SessionStat,
  SessionWindow,
  StrategyStat,
  TimeframeStat,
  Trade,
  TradeMatrixBucket,
  Transaction,
} from "../types";

export interface Filters {
  accountId?: string;
  month?: string; // YYYY-MM
  week?: string; // ISO date of week start
  assetClass?: string;
}

function qs(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.accountId) params.set("accountId", filters.accountId);
  if (filters.month) params.set("month", filters.month);
  if (filters.week) params.set("week", filters.week);
  if (filters.assetClass) params.set("assetClass", filters.assetClass);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get<Account[]>("/accounts")).data,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Account>) => (await api.post("/accounts", data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useTrades(filters: Filters) {
  return useQuery({
    queryKey: ["trades", filters],
    queryFn: async () => (await api.get<Trade[]>(`/trades${qs(filters)}`)).data,
  });
}

export function useCreateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => (await api.post("/trades", data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useUpdateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => (await api.put(`/trades/${id}`, data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/trades/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useErrorTags() {
  return useQuery({
    queryKey: ["error-tags"],
    queryFn: async () => (await api.get<ErrorTag[]>("/error-tags")).data,
  });
}

export function useCreateErrorTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; severity: number }) => (await api.post("/error-tags", data)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["error-tags"] }),
  });
}

export function useTransactions(accountId?: string) {
  return useQuery({
    queryKey: ["transactions", accountId],
    queryFn: async () => (await api.get<Transaction[]>(`/transactions${accountId ? `?accountId=${accountId}` : ""}`)).data,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Transaction>) => (await api.post("/transactions", data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useOverview(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "overview", filters],
    queryFn: async () => (await api.get<OverviewStats>(`/stats/overview${qs(filters)}`)).data,
  });
}

export function usePerformanceRadar(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "performance-radar", filters],
    queryFn: async () => (await api.get<PerformanceRadar>(`/stats/performance-radar${qs(filters)}`)).data,
  });
}

export function useDailyPnl(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "daily-pnl", filters],
    queryFn: async () => (await api.get<DailyPnlPoint[]>(`/stats/daily-pnl${qs(filters)}`)).data,
  });
}

export function useBySession(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "by-session", filters],
    queryFn: async () => (await api.get<SessionStat[]>(`/stats/by-session${qs(filters)}`)).data,
  });
}

export function useByTimeframe(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "by-timeframe", filters],
    queryFn: async () => (await api.get<TimeframeStat[]>(`/stats/by-timeframe${qs(filters)}`)).data,
  });
}

export function useBuySell(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "buy-sell", filters],
    queryFn: async () => (await api.get<BuySellStats>(`/stats/buy-sell${qs(filters)}`)).data,
  });
}

export function useActualVsTheoretical(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "actual-vs-theoretical", filters],
    queryFn: async () => (await api.get<ActualVsTheoreticalPoint[]>(`/stats/actual-vs-theoretical${qs(filters)}`)).data,
  });
}

export function useExecutionSummary(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "execution", filters],
    queryFn: async () => (await api.get<ExecutionSummary>(`/stats/execution${qs(filters)}`)).data,
  });
}

export function useTradeMatrix(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "trade-matrix", filters],
    queryFn: async () => (await api.get<TradeMatrixBucket[]>(`/stats/trade-matrix${qs(filters)}`)).data,
  });
}

export function useCommonErrors(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "common-errors", filters],
    queryFn: async () => (await api.get<CommonError[]>(`/stats/common-errors${qs(filters)}`)).data,
  });
}

export function useDrawdown(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "drawdown", filters],
    queryFn: async () => (await api.get<DrawdownPoint[]>(`/stats/drawdown${qs(filters)}`)).data,
  });
}

export function useByStrategy(filters: Filters) {
  return useQuery({
    queryKey: ["stats", "by-strategy", filters],
    queryFn: async () => (await api.get<StrategyStat[]>(`/stats/by-strategy${qs(filters)}`)).data,
  });
}

export function useSessionTimeline() {
  return useQuery({
    queryKey: ["stats", "sessions"],
    queryFn: async () => (await api.get<SessionWindow[]>("/stats/sessions")).data,
    refetchInterval: 60_000,
  });
}

export function usePortfolio() {
  return useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => (await api.get<PortfolioResponse>("/portfolio")).data,
  });
}
