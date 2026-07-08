"use client";

import { Fragment, useEffect, useMemo, type KeyboardEvent } from "react";
import {
  ArrowLeftRight,
  HandCoins,
  Receipt,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isDialogOpen } from "@/lib/dom";
import { dayLabel, money, toAmount } from "@/lib/format";
import { txnAccountLabel, txnSign, txnTitle } from "@/lib/txn";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/lib/api/types";

const TYPE_ICON: Record<TransactionType, LucideIcon> = {
  EXPENSE: Receipt,
  INCOME: TrendingUp,
  TRANSFER: ArrowLeftRight,
  LOAN: HandCoins,
};

interface DayGroup {
  key: string;
  label: string;
  total: number;
  items: Transaction[];
}

function groupByDay(items: Transaction[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const t of items) {
    const key = t.date.slice(0, 10);
    const group = map.get(key) ?? { key, label: dayLabel(t.date), total: 0, items: [] };
    group.total += txnSign(t) * toAmount(t.amount);
    group.items.push(t);
    map.set(key, group);
  }
  return [...map.values()];
}

export function TransactionsTable({
  transactions,
  emptyMessage,
  checkedIds,
  onToggleChecked,
  onToggleAll,
  onClearSelection,
  focusedId,
  onFocusChange,
  onRowClick,
  onRequestDelete,
  onToggleInspector,
  moreAvailable,
}: {
  transactions: Transaction[];
  emptyMessage: string;
  checkedIds: Set<string>;
  onToggleChecked: (id: string) => void;
  onToggleAll: (ids: string[], checked: boolean) => void;
  onClearSelection: () => void;
  focusedId: string | null;
  onFocusChange: (id: string | null) => void;
  onRowClick: (id: string) => void;
  onRequestDelete: (ids: string[]) => void;
  onToggleInspector: () => void;
  moreAvailable: boolean;
}) {
  const { t } = useTranslation();
  const groups = useMemo(() => groupByDay(transactions), [transactions]);
  const flatIds = useMemo(() => groups.flatMap((g) => g.items.map((txn) => txn.id)), [groups]);

  useEffect(() => {
    if (flatIds.length && !flatIds.includes(focusedId ?? "")) {
      onFocusChange(flatIds[0] ?? null);
    } else if (!flatIds.length && focusedId !== null) {
      onFocusChange(null);
    }
    // Only re-check when the visible id set changes, not on every focus/callback identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatIds]);

  const netTotal = useMemo(
    () => transactions.reduce((sum, txn) => sum + txnSign(txn) * toAmount(txn.amount), 0),
    [transactions]
  );

  const allChecked = flatIds.length > 0 && flatIds.every((id) => checkedIds.has(id));
  const someChecked = !allChecked && flatIds.some((id) => checkedIds.has(id));

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (isDialogOpen() || !flatIds.length) return;
    const idx = focusedId ? flatIds.indexOf(focusedId) : -1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      e.stopPropagation();
      onFocusChange(flatIds[Math.min(flatIds.length - 1, idx + 1)] ?? flatIds[0] ?? null);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      e.stopPropagation();
      onFocusChange(flatIds[Math.max(0, idx - 1)] ?? flatIds[0] ?? null);
    } else if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      onToggleInspector();
    } else if ((e.key === "Backspace" || e.key === "Delete") && focusedId) {
      e.preventDefault();
      e.stopPropagation();
      onRequestDelete([focusedId]);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="region"
        aria-label={t("web.transactions.title")}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="min-h-0 flex-1 overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
      >
        {transactions.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 py-16 text-center text-sm text-ink-3">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-11">
                  <Checkbox
                    aria-label={t("web.transactions.selectAll")}
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={(checked) => onToggleAll(flatIds, checked === true)}
                  />
                </TableHead>
                <TableHead>{t("web.transactions.columns.description")}</TableHead>
                <TableHead>{t("web.transactions.columns.account")}</TableHead>
                <TableHead className="text-right">
                  {t("web.transactions.columns.amount")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={4}
                      className="bg-paper-2 py-2 text-xs font-semibold text-ink-3"
                    >
                      <div className="flex items-center justify-between">
                        <span>{group.label}</span>
                        <span className="amount">{money(group.total, { sign: true })}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.items.map((txn) => {
                    const Icon = TYPE_ICON[txn.transactionType];
                    const sign = txnSign(txn);
                    const isFocused = focusedId === txn.id;
                    const titleLabels = {
                      transfer: t("add.types.transfer"),
                      uncategorized: t("web.dashboard.recent.fallbackDescription"),
                    };
                    const captionLine =
                      txn.transactionType === "TRANSFER"
                        ? t("add.types.transfer")
                        : txn.transactionType === "LOAN"
                          ? t("add.types.loan")
                          : (txn.subCategory?.category.name ??
                            t("web.dashboard.recent.fallbackDescription"));

                    return (
                      <TableRow
                        key={txn.id}
                        data-state={isFocused ? "selected" : undefined}
                        onClick={() => onRowClick(txn.id)}
                        className={cn(
                          "density-row cursor-pointer",
                          isFocused && "border-l-2 border-l-ink"
                        )}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            aria-label={t("web.transactions.selectRow", {
                              description: txnTitle(txn, titleLabels),
                              amount: money(toAmount(txn.amount)),
                            })}
                            checked={checkedIds.has(txn.id)}
                            onCheckedChange={() => onToggleChecked(txn.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-paper-2 text-ink-2">
                              <Icon className="h-[15px] w-[15px]" />
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium text-ink">
                                {txnTitle(txn, titleLabels)}
                              </div>
                              <div className="truncate text-[11.5px] text-ink-3">
                                {captionLine}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="truncate text-sm text-ink-2">
                          {txnAccountLabel(txn)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "amount text-right text-sm font-semibold",
                            sign > 0 && "text-positive",
                            sign < 0 && "text-negative",
                            sign === 0 && "text-ink"
                          )}
                        >
                          {money(
                            sign === 0 ? toAmount(txn.amount) : sign * toAmount(txn.amount),
                            { sign: sign !== 0 }
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-xs">
        {checkedIds.size > 0 ? (
          <>
            <span className="font-semibold text-ink">
              {t("web.transactions.selectedCount", { count: checkedIds.size })}
            </span>
            <span className="flex-1" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRequestDelete([...checkedIds])}
            >
              {t("web.transactions.bulkDelete")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
              {t("web.transactions.clearSelection")}
            </Button>
          </>
        ) : (
          <>
            <span className="text-ink-3">
              {t("web.transactions.transactionCount", { count: transactions.length })}
            </span>
            <span className="amount font-medium text-ink-2">
              {money(netTotal, { sign: true })}
            </span>
            {moreAvailable && (
              <>
                <span className="flex-1" />
                <span className="text-ink-4">{t("web.transactions.morePagination")}</span>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
