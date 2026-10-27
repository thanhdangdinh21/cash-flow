"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { addMonths, monthLabel } from "@/lib/format";

export function MonthPager({
  monthKey,
  onChange,
}: {
  monthKey: string;
  onChange: (next: string) => void;
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex items-center gap-1 rounded-md border border-line-2 bg-surface px-1 py-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={t("web.transactions.prevMonth")}
        onClick={() => onChange(addMonths(monthKey, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[9.5rem] text-center text-sm font-semibold text-ink">
        {monthLabel(monthKey, i18n.language)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        aria-label={t("web.transactions.nextMonth")}
        onClick={() => onChange(addMonths(monthKey, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
