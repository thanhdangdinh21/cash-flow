"use client";

import {
  ArrowLeftRight,
  HandCoins,
  Receipt,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { money, shortDate, toAmount } from "@/lib/format";
import { txnAccountLabel, txnSign, txnTitle } from "@/lib/txn";
import { cn } from "@/lib/utils";
import { isFullLoan, type Transaction, type TransactionType } from "@/lib/api/types";

const TYPE_ICON: Record<TransactionType, LucideIcon> = {
  EXPENSE: Receipt,
  INCOME: TrendingUp,
  TRANSFER: ArrowLeftRight,
  LOAN: HandCoins,
};

function Field({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="text-ink-3">{label}</span>
      <span className={cn("truncate font-medium", muted ? "text-ink-4" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}

export function TransactionInspector({
  transaction,
  onRequestDelete,
}: {
  transaction: Transaction;
  onRequestDelete: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const Icon = TYPE_ICON[transaction.transactionType];
  const sign = txnSign(transaction);
  const loan = transaction.loan;

  const titleLabels = {
    transfer: t("add.types.transfer"),
    uncategorized: t("web.dashboard.recent.fallbackDescription"),
  };

  const categoryLine =
    transaction.transactionType === "TRANSFER"
      ? t("add.types.transfer")
      : transaction.transactionType === "LOAN"
        ? t("add.types.loan")
        : (transaction.subCategory?.category.name ??
          t("web.dashboard.recent.fallbackDescription"));

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-y-auto rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper-2 text-ink-2">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-ink">
            {txnTitle(transaction, titleLabels)}
          </div>
          <div className="truncate text-xs text-ink-3">{categoryLine}</div>
        </div>
      </div>

      <div className="amount my-4 text-[26px] font-semibold text-ink">
        {money(sign === 0 ? toAmount(transaction.amount) : sign * toAmount(transaction.amount), {
          sign: sign !== 0,
        })}
      </div>

      <dl className="flex flex-col text-sm">
        <Field
          label={t("web.transactions.inspector.account")}
          value={txnAccountLabel(transaction)}
        />
        <Field label={t("add.date")} value={shortDate(transaction.date)} />
        {loan && isFullLoan(loan) && loan.interestRate && (
          <Field
            label={t("add.interest")}
            value={`${loan.interestRate}% ${loan.interestPeriod ?? ""}`.trim()}
          />
        )}
        {loan && isFullLoan(loan) && (
          <Field
            label={t("web.transactions.inspector.loanRemaining")}
            value={money(loan.remainingAmount)}
          />
        )}
        <Field
          label={t("txn.notes")}
          value={transaction.notes ?? t("web.transactions.inspector.notesEmpty")}
          muted={!transaction.notes}
        />
      </dl>

      {transaction.excludeFromReports && (
        <Badge variant="secondary" className="mt-1 w-fit">
          {t("web.transactions.inspector.excluded")}
        </Badge>
      )}

      <div className="mt-auto flex justify-end pt-4">
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => onRequestDelete([transaction.id])}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("txn.delete")}
        </Button>
      </div>
    </aside>
  );
}
