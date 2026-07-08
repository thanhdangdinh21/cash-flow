"use client";

import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/lib/api/types";

export type TransactionTypeFilter = "all" | TransactionType;

const FILTERS = [
  { id: "all", labelKey: "activity.all" },
  { id: "EXPENSE", labelKey: "add.types.expense" },
  { id: "INCOME", labelKey: "add.types.income" },
  { id: "TRANSFER", labelKey: "add.types.transfer" },
  { id: "LOAN", labelKey: "add.types.loan" },
] as const satisfies readonly { id: TransactionTypeFilter; labelKey: string }[];

export function FiltersBar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: {
  filter: TransactionTypeFilter;
  onFilterChange: (next: TransactionTypeFilter) => void;
  search: string;
  onSearchChange: (next: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.id
                ? "border-ink bg-ink text-paper"
                : "border-line-2 bg-surface text-ink-2 hover:bg-paper-2"
            )}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("web.transactions.searchPlaceholder")}
          className="h-10 pl-10"
        />
      </div>
    </div>
  );
}
