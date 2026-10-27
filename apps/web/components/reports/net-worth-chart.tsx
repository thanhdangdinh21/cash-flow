"use client";

import { useTranslation } from "react-i18next";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { useNetWorthReport } from "@/hooks/use-reports";
import { chartMonthLabel, money } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NetWorthPeriod } from "@/lib/api/types";

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 shadow-md">
      <div className="text-[11px] font-medium text-ink-3">{label}</div>
      <div className="amount text-sm font-semibold text-ink">
        {money(Array.isArray(value) ? (value[0] ?? 0) : (value ?? 0))}
      </div>
    </div>
  );
}

export function NetWorthChart({
  period,
  onPeriodChange,
}: {
  period: NetWorthPeriod;
  onPeriodChange: (next: NetWorthPeriod) => void;
}) {
  const { t, i18n } = useTranslation();
  const query = useNetWorthReport(period);

  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{t("web.reports.netWorth.title")}</h3>
        <div className="flex items-center gap-1">
          {(["month", "year"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              aria-pressed={period === p}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                period === p
                  ? "border-ink bg-ink text-paper"
                  : "border-line-2 bg-surface text-ink-2 hover:bg-paper-2"
              )}
            >
              {t(`web.reports.netWorth.period${p === "month" ? "Month" : "Year"}`)}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 p-3">
        <QueryState
          query={query}
          skeleton={<SkeletonBlock className="h-full" />}
        >
          {(data) => (
            <>
              <div className="amount px-1 pb-1 text-lg font-semibold text-ink">
                {money(data.current)}
              </div>
              <div className="h-[calc(100%-2rem)]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.series.map((p) => ({ ...p, label: chartMonthLabel(p.label, i18n.language) }))}
                    margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--line-2)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "var(--ink-3)", fontSize: 11 }}
                    />
                    <Tooltip content={(props) => <ChartTooltip {...props} />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--ink)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </QueryState>
      </div>
    </div>
  );
}

