"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/categories/category-icon";
import { CATEGORY_ICON_KEYS } from "@/lib/category-icons";
import {
  useAddSubCategory,
  useCreateCategory,
  useDeleteCategory,
  useRemoveSubCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import { extractErrorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/api/types";

type Scope = "all" | "EXPENSE" | "INCOME";

export function CategoryEditor({
  category,
  onClose,
  onDeleted,
}: {
  /** null = creating a new category. */
  category: Category | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const isNew = category === null;

  const initialScope: Scope =
    category?.accountType === "EXPENSE" || category?.accountType === "INCOME"
      ? category.accountType
      : "all";

  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState<string>(category?.icon ?? CATEGORY_ICON_KEYS[0] ?? "cart");
  const [scope, setScope] = useState<Scope>(initialScope);
  const [newSub, setNewSub] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const createCategory = useCreateCategory({ toastOnError: false });
  const updateCategory = useUpdateCategory({ toastOnError: false });
  const deleteCategory = useDeleteCategory({ toastOnError: false });
  const addSubCategory = useAddSubCategory({ toastOnError: false });
  const removeSubCategory = useRemoveSubCategory();

  const saving = createCategory.isPending || updateCategory.isPending;
  const canSave = name.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    setError(null);
    const accountType = scope === "all" ? null : scope;

    if (isNew) {
      createCategory.mutate(
        { name: name.trim(), icon, accountType: accountType ?? undefined },
        {
          onSuccess: () => onClose(),
          onError: (err) => setError(extractErrorMessage(err)),
        }
      );
      return;
    }

    updateCategory.mutate(
      { id: category.id, input: { name: name.trim(), icon, accountType } },
      {
        onSuccess: () => onClose(),
        onError: (err) => setError(extractErrorMessage(err)),
      }
    );
  }

  return (
    <aside className="flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center gap-3.5">
        <CategoryIcon icon={icon} size={48} />
        <div className="min-w-0 flex-1">
          <Label className="mb-1 block">{t("categories.name")}</Label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("categories.namePlaceholder")}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_ICON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setIcon(key)}
            className={cn(
              "rounded-lg border-2 p-0.5",
              icon === key ? "border-ink" : "border-transparent"
            )}
          >
            <CategoryIcon icon={key} size={36} />
          </button>
        ))}
      </div>

      <div className="border-t border-line pt-3.5">
        <Label className="mb-2 block">{t("categories.appliesTo")}</Label>
        <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("categories.allTypes")}</SelectItem>
            <SelectItem value="EXPENSE">{t("accounts.type.EXPENSE")}</SelectItem>
            <SelectItem value="INCOME">{t("accounts.type.INCOME")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!isNew && (
        <div className="border-t border-line pt-3.5">
          <Label className="mb-2 block">{t("categories.subcategories")}</Label>
          <div className="flex flex-col gap-1.5">
            {category.subCategories.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between gap-2 rounded-md bg-paper-2 px-3 py-2 text-sm"
              >
                <span className="truncate text-ink">{sub.name}</span>
                <button
                  type="button"
                  className="shrink-0 text-ink-3 hover:text-negative"
                  disabled={removeSubCategory.isPending}
                  onClick={() =>
                    removeSubCategory.mutate({ categoryId: category.id, subId: sub.id })
                  }
                  aria-label={t("categories.delete")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder={t("categories.addSubcategory")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSub.trim() && !addSubCategory.isPending) {
                  addSubCategory.mutate(
                    { categoryId: category.id, input: { name: newSub.trim() } },
                    {
                      onSuccess: () => setNewSub(""),
                      onError: (err) => setError(extractErrorMessage(err)),
                    }
                  );
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-9 shrink-0 p-0"
              disabled={!newSub.trim() || addSubCategory.isPending}
              aria-label={t("categories.addSubcategory")}
              onClick={() =>
                addSubCategory.mutate(
                  { categoryId: category.id, input: { name: newSub.trim() } },
                  {
                    onSuccess: () => setNewSub(""),
                    onError: (err) => setError(extractErrorMessage(err)),
                  }
                )
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
          {error}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2.5 border-t border-line pt-3.5">
        {!isNew && (
          <Button type="button" variant="danger" onClick={() => setConfirmOpen(true)}>
            {t("categories.delete")}
          </Button>
        )}
        <span className="flex-1" />
        <Button type="button" variant="outline" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button type="button" onClick={handleSave} disabled={!canSave || saving}>
          {t("common.save")}
        </Button>
      </div>

      {!isNew && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("categories.deleteTitle")}</DialogTitle>
              <DialogDescription>{t("categories.deleteMessage")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={deleteCategory.isPending}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={deleteCategory.isPending}
                onClick={() =>
                  deleteCategory.mutate(category.id, {
                    onSuccess: () => {
                      setConfirmOpen(false);
                      onDeleted();
                    },
                    onError: (err) => {
                      setConfirmOpen(false);
                      setError(extractErrorMessage(err));
                    },
                  })
                }
              >
                {t("categories.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </aside>
  );
}
