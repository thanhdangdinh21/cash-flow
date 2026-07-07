"use client";

import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { money } from "@/lib/format";
import type { HomeReportWeek } from "@/lib/api/types";

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 shadow-md">
      <div className="text-[11px] font-medium text-ink-3">{label}</div>
      {payload.map((entry) => {
        const value = Array.isArray(entry.value) ? entry.value[0] : entry.value;
        return (
          <div key={String(entry.dataKey)} className="amount flex items-center gap-2 text-xs">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: entry.color }}
            />
            <span className="text-ink-3">
              {entry.dataKey === "income" ? t("web.dashboard.cashflow.in") : t("web.dashboard.cashflow.out")}
            </span>
            <span className="font-semibold text-ink">{money(value ?? 0)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function CashflowChart({ weeks }: { weeks: HomeReportWeek[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{t("web.dashboard.cashflow.title")}</h3>
        <div className="flex items-center gap-3.5 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" />
            {t("web.dashboard.cashflow.in")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-negative" />
            {t("web.dashboard.cashflow.out")}
          </span>
        </div>
      </div>
      {/* Fixed plot height: a flex-measured 100% height lets Recharts mount on a
          pre-settle measurement and freeze bar scales there (stale-scale race). */}
      <div className="h-[190px] p-3">
        {weeks.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-3">
            {t("web.dashboard.cashflow.empty")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeks} barGap={4} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line-2)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--ink-3)", fontSize: 11 }}
              />
              <Tooltip content={(props) => <ChartTooltip {...props} />} cursor={{ fill: "var(--paper-2)" }} />
              <Bar dataKey="income" fill="var(--positive)" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
              <Bar dataKey="spent" fill="var(--negative)" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
