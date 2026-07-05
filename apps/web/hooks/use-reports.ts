"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api/reports";
import type { NetWorthPeriod, SpendingByCategoryParams } from "@/lib/api/types";
import { keys } from "@/hooks/query-keys";

export function useHomeReport() {
  return useQuery({
    queryKey: keys.reports.home,
    queryFn: reportsApi.home,
  });
}

export function useNetWorthReport(period: NetWorthPeriod = "month") {
  return useQuery({
    queryKey: keys.reports.netWorth(period),
    queryFn: () => reportsApi.netWorth(period),
  });
}

export function useSpendingByCategory(
  params: SpendingByCategoryParams = {}
) {
  return useQuery({
    queryKey: keys.reports.spending(params),
    queryFn: () => reportsApi.spendingByCategory(params),
  });
}

export function useCategoryTrend(categoryId: string, months = 6) {
  return useQuery({
    queryKey: keys.reports.trend(categoryId, months),
    queryFn: () => reportsApi.categoryTrend(categoryId, months),
    enabled: Boolean(categoryId),
  });
}
