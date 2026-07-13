"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/categories/category-icon";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/api/types";

type TypeFilter = "all" | "EXPENSE" | "INCOME";

export function CategoryTree({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () =>
      filter === "all" ? categories : categories.filter((c) => c.accountType === filter),
    [categories, filter]
  );

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as TypeFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("categories.allTypes")}</SelectItem>
            <SelectItem value="EXPENSE">{t("accounts.type.EXPENSE")}</SelectItem>
            <SelectItem value="INCOME">{t("accounts.type.INCOME")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-ink-4">{t("categories.noSubcategories")}</p>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((category) => {
            const isOpen = expanded.has(category.id);
            const hasSubs = category.subCategories.length > 0;
            return (
              <li key={category.id} className="border-b border-line last:border-0">
                <div
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 px-4 py-3 hover:bg-paper-2",
                    selectedId === category.id && "bg-paper-2"
                  )}
                  onClick={() => onSelect(category.id)}
                >
                  <button
                    type="button"
                    className="flex h-5 w-5 shrink-0 items-center justify-center text-ink-3"
                    aria-label={isOpen ? t("common.collapse") : t("common.expand")}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(category.id);
                    }}
                  >
                    {hasSubs ? (
                      isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )
                    ) : null}
                  </button>
                  <CategoryIcon icon={category.icon} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{category.name}</div>
                    <div className="truncate text-xs text-ink-3">
                      {hasSubs
                        ? category.subCategories.map((s) => s.name).join(" · ")
                        : t("categories.noSubcategories")}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {category.accountType
                      ? t(`accounts.type.${category.accountType}`)
                      : t("categories.allTypes")}
                  </Badge>
                </div>

                {isOpen && hasSubs && (
                  <ul className="flex flex-col bg-paper-2 pb-1.5 pl-[3.25rem]">
                    {category.subCategories.map((sub) => (
                      <li key={sub.id} className="py-1 text-xs text-ink-3">
                        {sub.name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
