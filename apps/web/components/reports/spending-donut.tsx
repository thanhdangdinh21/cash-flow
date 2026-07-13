"use client";

import { useTranslation } from "react-i18next";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import { MonthPager } from "@/components/transactions/month-pager";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { useSpendingByCategory } from "@/hooks/use-reports";
import { categoryMeta } from "@/lib/category-icons";
import { money, monthEndDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SpendingDirection, SpendingByCategoryItem } from "@/lib/api/types";

function tintFor(item: SpendingByCategoryItem): string {
  return item.categoryId ? categoryMeta(item.icon).tint : "var(--ink-3)";
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as SpendingByCategoryItem | undefined;
  if (!item) return null;
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 shadow-md">
      <div className="text-xs font-medium text-ink-2">{item.name}</div>
      <div className="amount text-sm font-semibold text-ink">{money(item.amount)}</div>
    </div>
  );
}

export function SpendingDonut({
  monthKey,
  onMonthChange,
  direction,
  onDirectionChange,
  onSelectCategory,
  selectedCategoryId,
}: {
  monthKey: string;
  onMonthChange: (next: string) => void;
  direction: SpendingDirection;
  onDirectionChange: (next: SpendingDirection) => void;
  onSelectCategory: (categoryId: string) => void;
  selectedCategoryId: string | null;
}) {
  const { t } = useTranslation();
  const query = useSpendingByCategory({
    from: `${monthKey}-01`,
    to: monthEndDate(monthKey),
    direction,
  });

  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{t("web.reports.spending.title")}</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {(["out", "in"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDirectionChange(d)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                  direction === d
                    ? "border-ink bg-ink text-paper"
                    : "border-line-2 bg-surface text-ink-2 hover:bg-paper-2"
                )}
              >
                {t(d === "out" ? "add.types.expense" : "add.types.income")}
              </button>
            ))}
          </div>
          <MonthPager monthKey={monthKey} onChange={onMonthChange} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <QueryState query={query} skeleton={<SkeletonBlock className="h-full" />}>
          {(data) =>
            data.items.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-ink-3">
                {t("web.reports.spending.empty")}
              </div>
            ) : (
              <div className="flex h-full items-center gap-6">
                <div className="h-[170px] w-[170px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.items}
                        dataKey="amount"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        isAnimationActive={false}
                        onClick={(entry) => {
                          const item = entry.payload as SpendingByCategoryItem;
                          if (item.categoryId) onSelectCategory(item.categoryId);
                        }}
                      >
                        {data.items.map((item) => {
                          const isSelected = item.categoryId !== null && item.categoryId === selectedCategoryId;
                          return (
                            <Cell
                              key={item.categoryId ?? "uncategorized"}
                              fill={tintFor(item)}
                              className={item.categoryId ? "cursor-pointer" : undefined}
                              stroke={isSelected ? "var(--ink)" : "var(--surface)"}
                              strokeWidth={isSelected ? 2 : 1}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip content={(props) => <ChartTooltip {...props} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  {data.items.map((item) => (
                    <button
                      key={item.categoryId ?? "uncategorized"}
                      type="button"
                      disabled={!item.categoryId}
                      onClick={() => item.categoryId && onSelectCategory(item.categoryId)}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-1.5 py-1 text-left",
                        item.categoryId && "hover:bg-paper-2",
                        item.categoryId !== null && item.categoryId === selectedCategoryId && "bg-paper-2"
                      )}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: tintFor(item) }}
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink-2">
                        {item.categoryId ? item.name : t("web.reports.spending.uncategorized")}
                      </span>
                      <span className="shrink-0 text-[11px] text-ink-3">
                        {data.total ? Math.round((item.amount / data.total) * 100) : 0}%
                      </span>
                      <span className="amount shrink-0 text-xs font-semibold text-ink">
                        {money(item.amount)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          }
        </QueryState>
      </div>
    </div>
  );
}
