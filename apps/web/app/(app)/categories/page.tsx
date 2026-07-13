"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { CategoryEditor } from "@/components/categories/category-editor";
import { CategoryTree } from "@/components/categories/category-tree";
import { useCategories } from "@/hooks/use-categories";

type Selection = { mode: "create" } | { mode: "edit"; id: string } | null;

function CategoriesSkeleton() {
  return (
    <div className="flex h-full gap-4">
      <SkeletonBlock className="h-full flex-1" />
      <SkeletonBlock className="h-full w-[380px] shrink-0" />
    </div>
  );
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const query = useCategories();
  const [selection, setSelection] = useState<Selection>(null);

  useEffect(() => {
    if (!query.data) return;
    if (selection?.mode === "edit" && !query.data.some((c) => c.id === selection.id)) {
      setSelection(null);
    }
  }, [query.data, selection]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("categories.title")}</h2>
          <p className="text-xs text-ink-3">{t("categories.note")}</p>
        </div>
        <Button type="button" size="sm" onClick={() => setSelection({ mode: "create" })}>
          <Plus className="h-3.5 w-3.5" />
          {t("categories.newTitle")}
        </Button>
      </div>

      <QueryState query={query} skeleton={<CategoriesSkeleton />}>
        {(categories) => {
          const editing =
            selection?.mode === "edit"
              ? (categories.find((c) => c.id === selection.id) ?? null)
              : null;

          return (
            <div className="flex min-h-0 flex-1 gap-4">
              <CategoryTree
                categories={categories}
                selectedId={selection?.mode === "edit" ? selection.id : null}
                onSelect={(id) => setSelection({ mode: "edit", id })}
              />
              {selection?.mode === "create" && (
                <CategoryEditor
                  key="new"
                  category={null}
                  onClose={() => setSelection(null)}
                  onDeleted={() => setSelection(null)}
                />
              )}
              {selection?.mode === "edit" && editing && (
                <CategoryEditor
                  key={editing.id}
                  category={editing}
                  onClose={() => setSelection(null)}
                  onDeleted={() => setSelection(null)}
                />
              )}
              {!selection && (
                <aside className="flex w-[380px] shrink-0 items-center justify-center rounded-lg border border-line bg-surface p-5 text-center text-sm text-ink-4">
                  {t("web.categories.selectHint")}
                </aside>
              )}
            </div>
          );
        }}
      </QueryState>
    </div>
  );
}
