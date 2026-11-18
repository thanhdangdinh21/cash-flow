"use client";

import { useTranslation } from "react-i18next";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { owedLine } from "@/lib/net-worth";
import { SkeletonBlock } from "@/components/ui/query-state";
import type { HomeReport, NetWorthSummary } from "@/lib/api/types";

function KpiCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  /** Undefined while loading */
  value: number | undefined;
  sub: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3.5">
      <div className="eyebrow">{label}</div>
      {value === undefined ? (
        <SkeletonBlock className="mt-1.5 h-7 w-28" />
      ) : (
        <div
          className={cn(
            "amount mt-1.5 text-xl font-semibold tracking-tight",
            tone === "positive" && "text-positive",
            tone === "negative" && "text-negative",
            !tone && "text-ink"
          )}
        >
          {money(value)}
        </div>
      )}
      <div className="mt-1 text-[11.5px] text-ink-3">{sub}</div>
    </div>
  );
}

export function KpiCards({
  report,
  netWorth,
}: {
  report: HomeReport;
  /** From GET /reports/net-worth-summary; undefined while loading */
  netWorth: NetWorthSummary | undefined;
}) {
  const { t } = useTranslation();
  const { monthIncome, monthSpent, net } = report;
  const keptPct = monthIncome > 0 ? Math.round((net / monthIncome) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label={t("web.dashboard.kpi.netWorth")}
        value={netWorth?.netWorth}
        sub={(netWorth && owedLine(netWorth, t)) ?? t("web.dashboard.kpi.netWorthSub")}
        tone={netWorth && netWorth.netWorth < 0 ? "negative" : undefined}
      />
      <KpiCard
        label={t("web.dashboard.kpi.monthIncome")}
        value={monthIncome}
        sub={t("web.dashboard.kpi.monthIncomeSub")}
        tone="positive"
      />
      <KpiCard
        label={t("web.dashboard.kpi.monthSpent")}
        value={-monthSpent}
        sub={t("web.dashboard.kpi.monthSpentSub")}
        tone={monthSpent > 0 ? "negative" : undefined}
      />
      <KpiCard
        label={t("web.dashboard.kpi.net")}
        value={net}
        sub={
          monthIncome === 0 && monthSpent === 0
            ? t("web.dashboard.kpi.netSubEmpty")
            : net >= 0 && monthIncome > 0
              ? t("web.dashboard.kpi.netSubKept", { pct: keptPct })
              : t("web.dashboard.kpi.netSubOver")
        }
        tone={net > 0 ? "positive" : net < 0 ? "negative" : undefined}
      />
    </div>
  );
}
