import { api } from "../api";
import type {
  CategoryTrendReport,
  HomeReport,
  NetWorthPeriod,
  NetWorthReport,
  SpendingByCategoryParams,
  SpendingByCategoryReport,
} from "./types";

export const reportsApi = {
  home: () => api.get<HomeReport>("/reports/home").then((r) => r.data),
  netWorth: (period: NetWorthPeriod = "month") =>
    api
      .get<NetWorthReport>("/reports/net-worth", { params: { period } })
      .then((r) => r.data),
  spendingByCategory: (params: SpendingByCategoryParams = {}) =>
    api
      .get<SpendingByCategoryReport>("/reports/spending-by-category", {
        params,
      })
      .then((r) => r.data),
  categoryTrend: (categoryId: string, months = 6) =>
    api
      .get<CategoryTrendReport>(`/reports/category-trend/${categoryId}`, {
        params: { months },
      })
      .then((r) => r.data),
};
