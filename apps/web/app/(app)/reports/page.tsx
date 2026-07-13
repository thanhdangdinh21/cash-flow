"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { CategoryTrendChart } from "@/components/reports/category-trend-chart";
import { NetWorthChart } from "@/components/reports/net-worth-chart";
import { SpendingDonut } from "@/components/reports/spending-donut";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { useHomeReport } from "@/hooks/use-reports";
import { monthKeyOf } from "@/lib/format";
import type { NetWorthPeriod, SpendingDirection } from "@/lib/api/types";

export default function ReportsPage() {
  const { t } = useTranslation();
  const homeReport = useHomeReport();

  const [period, setPeriod] = useState<NetWorthPeriod>("month");
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(new Date().toISOString()));
  const [direction, setDirection] = useState<SpendingDirection>("out");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col gap-4">
      <h2 className="sr-only">{t("web.nav.reports")}</h2>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-4">
        <NetWorthChart period={period} onPeriodChange={setPeriod} />

        <QueryState query={homeReport} skeleton={<SkeletonBlock className="h-full" />}>
          {(data) => (
            <CashflowChart weeks={data.weeks} title={t("web.reports.cashflow.title")} />
          )}
        </QueryState>

        <SpendingDonut
          monthKey={monthKey}
          onMonthChange={(next) => {
            setMonthKey(next);
            setSelectedCategoryId(null);
          }}
          direction={direction}
          onDirectionChange={(next) => {
            setDirection(next);
            setSelectedCategoryId(null);
          }}
          onSelectCategory={setSelectedCategoryId}
          selectedCategoryId={selectedCategoryId}
        />

        <CategoryTrendChart categoryId={selectedCategoryId} />
      </div>
    </div>
  );
}
