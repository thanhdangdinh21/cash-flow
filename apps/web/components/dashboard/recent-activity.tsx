"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  HandCoins,
  type LucideIcon,
} from "lucide-react";
import { dayLabel, money, toAmount } from "@/lib/format";
import { txnAccountLabel, txnSign, txnTitle } from "@/lib/txn";
import { cn } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/lib/api/types";

const TYPE_ICON: Record<TransactionType, LucideIcon> = {
  INCOME: ArrowDownLeft,
  EXPENSE: ArrowUpRight,
  TRANSFER: ArrowLeftRight,
  LOAN: HandCoins,
};

export function RecentActivity({ recent }: { recent: Transaction[] }) {
  const { t, i18n } = useTranslation();
  const titleLabels = {
    transfer: t("add.types.transfer"),
    uncategorized: t("web.dashboard.recent.fallbackDescription"),
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{t("web.dashboard.recent.title")}</h3>
        <Link href="/transactions" className="text-xs font-semibold text-ink hover:underline">
          {t("web.dashboard.recent.viewAll")}
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {recent.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 py-8 text-center text-sm text-ink-3">
            {t("web.dashboard.recent.empty")}
          </div>
        ) : (
          recent.map((txn) => {
            const Icon = TYPE_ICON[txn.transactionType];
            const sign = txnSign(txn);

            return (
              <div
                key={txn.id}
                className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink-2">
                  <Icon size={14} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {txnTitle(txn, titleLabels)}
                  </div>
                  <div className="truncate text-[11.5px] text-ink-3">
                    {txnAccountLabel(txn)} · {dayLabel(txn.date, i18n.language)}
                  </div>
                </div>
                <span
                  className={cn(
                    "amount shrink-0 text-sm font-semibold",
                    sign > 0 && "text-positive",
                    sign < 0 && "text-negative",
                    sign === 0 && "text-ink"
                  )}
                >
                  {money(sign === 0 ? toAmount(txn.amount) : sign * toAmount(txn.amount), {
                    sign: sign !== 0,
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
