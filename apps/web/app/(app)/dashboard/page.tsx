"use client";

import { useTranslation } from "react-i18next";
import { useHomeReport } from "@/hooks/use-reports";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { CashflowChart } from "@/components/dashboard/cashflow-chart";
import { AccountsSummary } from "@/components/dashboard/accounts-summary";
import { RecentActivity } from "@/components/dashboard/recent-activity";

function DashboardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonBlock className="h-[86px]" />
        <SkeletonBlock className="h-[86px]" />
        <SkeletonBlock className="h-[86px]" />
        <SkeletonBlock className="h-[86px]" />
      </div>
      <SkeletonBlock className="h-[258px] flex-none" />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 lg:grid-cols-[2fr_1fr]">
        <SkeletonBlock className="h-full" />
        <SkeletonBlock className="h-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const query = useHomeReport();

  return (
    <div className="flex h-full flex-col gap-4">
      <h2 className="sr-only">{t("web.dashboard.title")}</h2>
      <QueryState query={query} skeleton={<DashboardSkeleton />}>
        {(report) => (
          <>
            <KpiCards report={report} />

            <div className="h-[258px] flex-none">
              <CashflowChart weeks={report.weeks} />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 lg:grid-cols-[2fr_1fr]">
              <RecentActivity recent={report.recent} />
              <AccountsSummary wallets={report.wallets} />
            </div>
          </>
        )}
      </QueryState>
    </div>
  );
}
