"use client";

import { Fragment, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Gem, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { money, toAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Account, AccountType } from "@/lib/api/types";

const TYPE_ORDER: AccountType[] = ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"];

const TYPE_ICON: Record<AccountType, LucideIcon> = {
  ASSET: Wallet,
  LIABILITY: CreditCard,
  INCOME: TrendingUp,
  EXPENSE: TrendingUp,
  EQUITY: TrendingUp,
};

function accountIcon(account: Account): LucideIcon {
  if (account.holdings && account.holdings.length > 0) return Gem;
  return TYPE_ICON[account.type];
}

export function AccountsTable({
  accounts,
  selectedId,
  onSelect,
}: {
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();

  const groups = useMemo(
    () =>
      TYPE_ORDER.map((type) => ({
        type,
        items: accounts.filter((a) => a.type === type),
      })).filter((g) => g.items.length > 0),
    [accounts]
  );

  const netWorth = useMemo(
    () =>
      accounts.reduce((sum, a) => {
        const v = toAmount(a.currentBalance);
        return sum + (a.type === "ASSET" ? v : a.type === "LIABILITY" ? -v : 0);
      }, 0),
    [accounts]
  );
  const totalAssets = useMemo(
    () =>
      accounts
        .filter((a) => a.type === "ASSET")
        .reduce((sum, a) => sum + toAmount(a.currentBalance), 0),
    [accounts]
  );
  const totalLiabilities = useMemo(
    () =>
      accounts
        .filter((a) => a.type === "LIABILITY")
        .reduce((sum, a) => sum + toAmount(a.currentBalance), 0),
    [accounts]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-baseline gap-6 border-b border-line px-5 py-4">
        <div>
          <span className="eyebrow">{t("web.accounts.netWorth")}</span>
          <div className="amount mt-1 text-[26px] font-semibold text-ink">{money(netWorth)}</div>
        </div>
        <div className="ml-auto flex gap-6 text-right">
          <div>
            <span className="eyebrow">{t("accounts.group.ASSET")}</span>
            <div className="amount mt-1 text-sm font-semibold text-ink">{money(totalAssets)}</div>
          </div>
          <div>
            <span className="eyebrow">{t("accounts.group.LIABILITY")}</span>
            <div className="amount mt-1 text-sm font-semibold text-negative">
              {money(totalLiabilities)}
            </div>
          </div>
        </div>
      </div>

      {accounts.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-ink-4">{t("accounts.empty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("accounts.form.name")}</TableHead>
              <TableHead>{t("accounts.form.currency")}</TableHead>
              <TableHead className="text-right">{t("web.accounts.balance")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => {
              const subtotal = group.items.reduce((sum, a) => sum + toAmount(a.currentBalance), 0);
              return (
                <Fragment key={group.type}>
                  <TableRow className="bg-paper-2 hover:bg-paper-2">
                    <TableCell colSpan={2} className="py-2 text-xs font-semibold text-ink-3">
                      {t(`accounts.group.${group.type}`)} · {group.items.length}
                    </TableCell>
                    <TableCell className="amount py-2 text-right text-xs font-semibold text-ink-3">
                      {money(subtotal)}
                    </TableCell>
                  </TableRow>
                  {group.items.map((account) => {
                    const Icon = accountIcon(account);
                    const isCommodity = Boolean(account.holdings && account.holdings.length > 0);
                    return (
                      <TableRow
                        key={account.id}
                        data-state={account.id === selectedId ? "selected" : undefined}
                        className="cursor-pointer"
                        onClick={() => onSelect(account.id)}
                      >
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-paper-2 text-ink-2">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="truncate font-medium text-ink">{account.name}</span>
                            {account.isDefault && (
                              <Badge variant="secondary" className="shrink-0">
                                {t("accounts.defaultAccount")}
                              </Badge>
                            )}
                            {isCommodity && (
                              <Badge variant="secondary" className="shrink-0">
                                {t("accounts.commodity")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-ink-3">{account.currencyCode}</TableCell>
                        <TableCell
                          className={cn(
                            "amount text-right font-semibold",
                            toAmount(account.currentBalance) < 0 ? "text-negative" : "text-ink"
                          )}
                        >
                          {money(account.currentBalance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
