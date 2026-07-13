"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Gem, Trash2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { useAccount, useAddHolding, useDeleteAccount, useRemoveHolding } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { dayLabel, money, toAmount } from "@/lib/format";
import { txnAccountLabel, txnSign, txnTitle } from "@/lib/txn";
import { cn } from "@/lib/utils";
import type { AccountDetail } from "@/lib/api/types";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="text-ink-3">{label}</span>
      <span className="truncate font-medium text-ink">{value}</span>
    </div>
  );
}

function HoldingsSection({ account }: { account: AccountDetail }) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [holdingName, setHoldingName] = useState("");
  const [unitName, setUnitName] = useState("");
  const addHolding = useAddHolding();
  const removeHolding = useRemoveHolding();

  const purchases = account.lots.filter((l) => l.type === "DEBIT" && l.quantity);

  return (
    <div className="flex flex-col gap-3">
      <span className="eyebrow">{t("accounts.form.holdings")}</span>

      {account.holdings.length === 0 ? (
        <p className="text-sm text-ink-4">{t("accounts.form.noHoldings")}</p>
      ) : (
        account.holdings.map((h) => {
          const qty = toAmount(h.currentQuantity);
          const cost = toAmount(h.currentCost);
          const avg = qty > 0 ? cost / qty : 0;
          return (
            <div key={h.id} className="rounded-md border border-line-2 bg-paper-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{h.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-negative"
                  disabled={removeHolding.isPending}
                  onClick={() => removeHolding.mutate({ accountId: account.id, holdingId: h.id })}
                >
                  {t("accounts.form.remove")}
                </Button>
              </div>
              <div className="amount mt-1 text-lg font-semibold text-ink">
                {qty} {h.unitName}
              </div>
              <div className="mt-1 text-xs text-ink-3">
                {t("accounts.detail.totalCost")}: {money(cost)} · {t("accounts.detail.avgUnitPrice")}:{" "}
                {money(avg)} / {h.unitName}
              </div>
            </div>
          );
        })
      )}

      {adding ? (
        <div className="flex flex-col gap-2 rounded-md border border-line-2 p-3">
          <Input
            autoFocus
            value={holdingName}
            onChange={(e) => setHoldingName(e.target.value)}
            placeholder={t("accounts.form.name")}
          />
          <Input
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            placeholder={t("accounts.create.unitPlaceholder")}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!holdingName.trim() || addHolding.isPending}
              onClick={() =>
                addHolding.mutate(
                  {
                    accountId: account.id,
                    input: { name: holdingName.trim(), unitName: unitName.trim() || "unit" },
                  },
                  {
                    onSuccess: () => {
                      setAdding(false);
                      setHoldingName("");
                      setUnitName("");
                    },
                  }
                )
              }
            >
              {t("accounts.form.addHolding")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          {t("accounts.form.addHolding")}
        </Button>
      )}

      <div className="mt-2 flex flex-col gap-1">
        <span className="eyebrow">{t("accounts.detail.purchases")}</span>
        {purchases.length === 0 ? (
          <p className="py-2 text-sm text-ink-4">{t("accounts.detail.noPurchases")}</p>
        ) : (
          purchases.map((lot) => {
            const qty = toAmount(lot.quantity ?? "0");
            const amount = toAmount(lot.amount);
            const unit = qty > 0 ? amount / qty : 0;
            return (
              <div
                key={lot.id}
                className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-0"
              >
                <div>
                  <div className="font-medium text-ink">+ {qty} {account.holdings[0]?.unitName ?? ""}</div>
                  <div className="text-xs text-ink-3">
                    {dayLabel(lot.transaction.date)} · {money(unit)}
                  </div>
                </div>
                <span className="amount font-semibold text-ink">− {money(amount)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function TransactionHistory({ accountId }: { accountId: string }) {
  const { t } = useTranslation();
  const query = useTransactions({ accountId, limit: 20 });
  const titleLabels = {
    transfer: t("add.types.transfer"),
    uncategorized: t("web.dashboard.recent.fallbackDescription"),
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{t("accounts.detail.history")}</span>
      <QueryState
        query={query}
        skeleton={
          <div className="flex flex-col gap-2 py-2">
            <SkeletonBlock className="h-10" />
            <SkeletonBlock className="h-10" />
          </div>
        }
      >
        {(data) =>
          data.items.length === 0 ? (
            <p className="py-2 text-sm text-ink-4">{t("accounts.detail.noHistory")}</p>
          ) : (
            data.items.map((txn) => {
              const sign = txnSign(txn);
              return (
                <div
                  key={txn.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm last:border-0"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">{txnTitle(txn, titleLabels)}</div>
                    <div className="truncate text-xs text-ink-3">
                      {txnAccountLabel(txn)} · {dayLabel(txn.date)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "amount shrink-0 font-semibold",
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
          )
        }
      </QueryState>
    </div>
  );
}

export function AccountInspector({
  accountId,
  onDeleted,
}: {
  accountId: string;
  onDeleted: () => void;
}) {
  const { t } = useTranslation();
  const query = useAccount(accountId);
  const deleteAccount = useDeleteAccount();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <aside className="flex w-[340px] shrink-0 flex-col gap-4 overflow-y-auto rounded-lg border border-line bg-surface p-5">
      <QueryState
        query={query}
        skeleton={
          <div className="flex flex-col gap-3">
            <SkeletonBlock className="h-10" />
            <SkeletonBlock className="h-24" />
          </div>
        }
      >
        {(account) => {
          const isCommodity = account.holdings.length > 0;
          const Icon = isCommodity ? Gem : account.type === "LIABILITY" ? CreditCard : Wallet;

          return (
            <>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-paper-2 text-ink-2">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-ink">{account.name}</div>
                  <div className="truncate text-xs text-ink-3">
                    {t(`accounts.type.${account.type}`)}
                    {isCommodity ? ` · ${t("accounts.commodity")}` : ""}
                  </div>
                </div>
                {account.isDefault && <Badge variant="secondary">{t("accounts.defaultAccount")}</Badge>}
              </div>

              {!isCommodity && (
                <>
                  <div className="amount text-[26px] font-semibold text-ink">
                    {money(account.currentBalance)}
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 rounded-md bg-paper-2 px-3 py-2.5">
                      <div className="text-xs text-ink-3">{t("accounts.detail.in")}</div>
                      <div className="amount text-sm font-semibold text-positive">
                        + {money(account.monthIn)}
                      </div>
                    </div>
                    <div className="flex-1 rounded-md bg-paper-2 px-3 py-2.5">
                      <div className="text-xs text-ink-3">{t("accounts.detail.out")}</div>
                      <div className="amount text-sm font-semibold text-negative">
                        − {money(account.monthOut)}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <dl className="flex flex-col text-sm">
                <Field label={t("accounts.form.type")} value={t(`accounts.type.${account.type}`)} />
                <Field label={t("accounts.form.currency")} value={account.currencyCode} />
              </dl>

              {isCommodity ? (
                <HoldingsSection account={account} />
              ) : (
                <TransactionHistory accountId={account.id} />
              )}

              <div className="mt-auto flex justify-end pt-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("accounts.form.remove")}
                </Button>
              </div>

              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t("accounts.deleteTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("accounts.deleteMessage", { name: account.name })}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmOpen(false)}
                      disabled={deleteAccount.isPending}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={deleteAccount.isPending}
                      onClick={() =>
                        deleteAccount.mutate(account.id, {
                          onSuccess: () => {
                            setConfirmOpen(false);
                            onDeleted();
                          },
                        })
                      }
                    >
                      {t("accounts.form.remove")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          );
        }}
      </QueryState>
    </aside>
  );
}
