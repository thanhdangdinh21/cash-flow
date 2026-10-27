"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { FiltersBar, type TransactionTypeFilter } from "@/components/transactions/filters-bar";
import { MonthPager } from "@/components/transactions/month-pager";
import { TransactionInspector } from "@/components/transactions/transaction-inspector";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { useDeleteTransaction, useTransactions } from "@/hooks/use-transactions";
import { monthEndDate, monthKeyOf } from "@/lib/format";
import { txnAccountLabel, txnTitle } from "@/lib/txn";

function TransactionsSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-40" />
        <SkeletonBlock className="h-10 flex-1" />
      </div>
      <SkeletonBlock className="h-full flex-1" />
    </div>
  );
}

export default function TransactionsPage() {
  const { t } = useTranslation();
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(new Date().toISOString()));
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>("all");
  const [search, setSearch] = useState("");
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const from = `${monthKey}-01`;
  const to = monthEndDate(monthKey);
  const query = useTransactions({ from, to, limit: 100 });
  const deleteMutation = useDeleteTransaction();

  const filtered = useMemo(() => {
    if (!query.data) return [];
    const titleLabels = {
      transfer: t("add.types.transfer"),
      uncategorized: t("web.dashboard.recent.fallbackDescription"),
    };
    let items = query.data.items;
    if (typeFilter !== "all") {
      items = items.filter((txn) => txn.transactionType === typeFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter((txn) => {
        const haystack = [
          txnTitle(txn, titleLabels),
          txnAccountLabel(txn),
          txn.subCategory?.category.name ?? "",
          txn.contact?.name ?? "",
          txn.notes ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return items;
  }, [query.data, typeFilter, search, t]);

  const focusedTransaction = filtered.find((txn) => txn.id === focusedId) ?? null;

  function changeMonth(next: string) {
    setMonthKey(next);
    setCheckedIds(new Set());
    setFocusedId(null);
  }

  function requestDelete(ids: string[]) {
    if (ids.length) setPendingDeleteIds(ids);
  }

  async function confirmDelete() {
    if (!pendingDeleteIds) return;
    setIsDeleting(true);
    const ids = pendingDeleteIds;
    const succeededIds: string[] = [];
    for (const id of ids) {
      try {
        await deleteMutation.mutateAsync(id);
        succeededIds.push(id);
      } catch {
        // the mutation's own onError already surfaced a toast
      }
    }
    setIsDeleting(false);
    setPendingDeleteIds(null);
    if (succeededIds.length > 0) {
      toast.success(t("web.transactions.deletedToast", { count: succeededIds.length }));
      setCheckedIds((prev) => {
        const next = new Set(prev);
        succeededIds.forEach((id) => next.delete(id));
        return next;
      });
      if (focusedId && succeededIds.includes(focusedId)) {
        setFocusedId(null);
      }
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <h2 className="sr-only">{t("web.transactions.title")}</h2>

      <div className="flex flex-wrap items-center gap-3">
        <MonthPager monthKey={monthKey} onChange={changeMonth} />
        <FiltersBar
          filter={typeFilter}
          onFilterChange={setTypeFilter}
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      <QueryState query={query} skeleton={<TransactionsSkeleton />}>
        {(data) => (
          <div className="flex min-h-0 flex-1 gap-4">
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-surface">
              <TransactionsTable
                transactions={filtered}
                emptyMessage={
                  data.items.length === 0
                    ? t("web.transactions.emptyMonth")
                    : t("web.transactions.emptyFiltered")
                }
                checkedIds={checkedIds}
                onToggleChecked={(id) =>
                  setCheckedIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                onToggleAll={(ids, checked) =>
                  setCheckedIds((prev) => {
                    const next = new Set(prev);
                    ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
                    return next;
                  })
                }
                onClearSelection={() => setCheckedIds(new Set())}
                focusedId={focusedId}
                onFocusChange={setFocusedId}
                onRowClick={(id) => {
                  setFocusedId(id);
                  setInspectorOpen(true);
                }}
                onRequestDelete={requestDelete}
                onToggleInspector={() => setInspectorOpen((prev) => !prev)}
                moreAvailable={Boolean(data.nextCursor)}
              />
            </div>

            {inspectorOpen && focusedTransaction && (
              <TransactionInspector
                transaction={focusedTransaction}
                onRequestDelete={requestDelete}
              />
            )}
          </div>
        )}
      </QueryState>

      <Dialog
        open={pendingDeleteIds !== null}
        onOpenChange={(open) => !open && setPendingDeleteIds(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDeleteIds && pendingDeleteIds.length > 1
                ? t("web.transactions.deleteManyTitle", { count: pendingDeleteIds.length })
                : t("txn.deleteTitle")}
            </DialogTitle>
            <DialogDescription>
              {pendingDeleteIds && pendingDeleteIds.length > 1
                ? t("web.transactions.deleteManyMessage")
                : t("txn.deleteMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDeleteIds(null)}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="button" variant="danger" onClick={confirmDelete} disabled={isDeleting}>
              {t("txn.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
