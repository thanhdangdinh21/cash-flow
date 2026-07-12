"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { NAV_ITEMS } from "@/components/layout/nav-links";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useOverlays } from "@/components/shell/overlays-context";
import { money } from "@/lib/format";
import { parseQuickAdd } from "@/lib/quick-add-parser";
import { cn } from "@/lib/utils";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CommandBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const overlays = useOverlays();
  const [query, setQuery] = useState("");
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const createTransaction = useCreateTransaction();

  const parsed = useMemo(
    () => (accounts.length ? parseQuickAdd({ accounts, categories }, query) : null),
    [accounts, categories, query]
  );

  const matchingNavItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || parsed) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) => t(item.labelKey).toLowerCase().includes(q));
  }, [query, parsed, t]);

  function reset() {
    setQuery("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      onClose();
    }
  }

  function go(href: string) {
    router.push(href);
    reset();
    onClose();
  }

  function addInstantly() {
    if (!parsed) return;
    const typeLabel = t(parsed.income ? "add.types.income" : "add.types.expense");
    createTransaction.mutate(
      {
        transactionType: parsed.income ? "INCOME" : "EXPENSE",
        amount: parsed.amount,
        date: todayISO(),
        accountId: parsed.accountId,
        subCategoryId: parsed.subCategoryId,
        description: parsed.merchant,
      },
      {
        onSuccess: () => {
          toast.success(
            t("web.commandBar.added", {
              type: typeLabel,
              amount: money(parsed.income ? parsed.amount : -parsed.amount, { sign: true }),
            })
          );
          reset();
          onClose();
        },
      }
    );
  }

  function editDetails() {
    if (!parsed) return;
    overlays.openAddTransactionPrefilled({
      type: parsed.income ? "INCOME" : "EXPENSE",
      amountText: parsed.amount.toFixed(2),
      description: parsed.merchant,
      accountId: parsed.accountId,
      subCategoryId: parsed.subCategoryId,
    });
    reset();
    onClose();
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("web.shell.search")}
      shouldFilter={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("web.commandBar.placeholder")}
        onKeyDown={(e) => {
          if (e.key === "Tab" && parsed) {
            e.preventDefault();
            editDetails();
          }
        }}
      />
      <CommandList>
        <CommandEmpty>{t("web.commandBar.empty")}</CommandEmpty>

        {parsed && (
          <CommandGroup heading={t("web.commandBar.quickAdd")}>
            <CommandItem value="quick-add-instant" onSelect={addInstantly}>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate font-medium">{parsed.merchant}</span>
                <span className="shrink-0 truncate text-xs text-ink-3">
                  {parsed.subCategoryLabel ?? t("web.commandBar.uncategorized")} ·{" "}
                  {parsed.accountName}
                </span>
              </div>
              <span
                className={cn(
                  "amount ml-auto shrink-0 font-semibold",
                  parsed.income ? "text-positive" : "text-negative"
                )}
              >
                {money(parsed.income ? parsed.amount : -parsed.amount, { sign: true })}
              </span>
              <CommandShortcut>⏎</CommandShortcut>
            </CommandItem>
            <CommandItem value="quick-add-edit" onSelect={editDetails}>
              <span>{t("web.commandBar.editDetails")}</span>
              <CommandShortcut>⇥</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        {matchingNavItems.length > 0 && (
          <CommandGroup heading={t("web.commandBar.navigate")}>
            {matchingNavItems.map((item) => (
              <CommandItem
                key={item.href}
                value={`nav-${item.href}`}
                onSelect={() => go(item.href)}
              >
                <item.icon className="h-4 w-4 text-ink-3" />
                <span>{t(item.labelKey)}</span>
                <CommandShortcut>{item.kbd}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
