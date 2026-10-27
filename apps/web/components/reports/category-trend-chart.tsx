"use client";

import { useTranslation } from "react-i18next";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { CategoryIcon } from "@/components/categories/category-icon";
import { useCategoryTrend } from "@/hooks/use-reports";
import { chartMonthLabel, money } from "@/lib/format";

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

export function CategoryTrendChart({ categoryId }: { categoryId: string | null }) {
  const { t, i18n } = useTranslation();
  const query = useCategoryTrend(categoryId ?? "", 6);

  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{t("web.reports.trend.title")}</h3>
      </div>

      <div className="min-h-0 flex-1 p-3">
        {!categoryId ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-3">
            {t("web.reports.trend.placeholder")}
          </div>
        ) : (
          <QueryState query={query} skeleton={<SkeletonBlock className="h-full" />}>
            {(data) => (
              <>
                <div className="flex items-center gap-2 px-1 pb-2">
                  <CategoryIcon icon={data.category.icon} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">
                      {data.category.name}
                    </div>
                    <div className="text-[11px] text-ink-3">
                      {t("web.reports.trend.thisMonth")}: {money(data.thisMonth)} ·{" "}
                      {t("web.reports.trend.average")}: {money(data.average)}
                    </div>
                  </div>
                </div>
                <div className="h-[calc(100%-3rem)]">
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
                        stroke="var(--info)"
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
        )}
      </div>
    </div>
  );
}
