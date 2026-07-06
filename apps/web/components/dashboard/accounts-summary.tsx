"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { money, toAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HomeReportWallet } from "@/lib/api/types";

export function AccountsSummary({ wallets }: { wallets: HomeReportWallet[] }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-semibold text-ink">{t("web.dashboard.accounts.title")}</h3>
        <Link href="/accounts" className="text-xs font-semibold text-ink hover:underline">
          {t("web.dashboard.accounts.manage")}
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {wallets.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 py-8 text-center text-sm text-ink-3">
            {t("web.dashboard.accounts.empty")}
          </div>
        ) : (
          wallets.map((wallet) => {
            const balance = toAmount(wallet.currentBalance);
            return (
              <div
                key={wallet.id}
                className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink">{wallet.name}</div>
                  <div className="font-mono text-[11px] text-ink-3">{wallet.currencyCode}</div>
                </div>
                <span
                  className={cn(
                    "amount shrink-0 text-sm font-semibold",
                    balance < 0 ? "text-negative" : "text-ink"
                  )}
                >
                  {money(balance, { sign: balance < 0 })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
