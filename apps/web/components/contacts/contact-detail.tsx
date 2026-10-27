"use client";

import { useTranslation } from "react-i18next";
import { HandCoins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { useOverlays } from "@/components/shell/overlays-context";
import { useContactLoans, useContacts } from "@/hooks/use-contacts";
import { dayLabel, money, toAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Loan, LoanDirection } from "@/lib/api/types";

function settleDirFor(direction: LoanDirection): "COLLECTED" | "REPAID" {
  return direction === "LENT" ? "COLLECTED" : "REPAID";
}

function LoanRow({ loan, contactId }: { loan: Loan; contactId: string }) {
  const { t, i18n } = useTranslation();
  const overlays = useOverlays();
  const isActive = loan.status === "ACTIVE";

  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-3 text-sm last:border-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">
            {t(`add.debt.${loan.direction}.label`)}
          </span>
          <Badge variant={isActive ? "warning" : "secondary"} className="shrink-0">
            {isActive ? t("contacts.active") : t("contacts.settledStatus")}
          </Badge>
        </div>
        <div className="text-xs text-ink-3">{dayLabel(loan.date, i18n.language)}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="amount font-semibold text-ink">{money(loan.remainingAmount)}</div>
        <div className="text-[11px] text-ink-3">
          {t("contacts.ofPrincipal", { amount: money(loan.principal) })}
        </div>
      </div>
      {isActive && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            overlays.openSettleLoan({
              contactId,
              loanId: loan.id,
              debtDir: settleDirFor(loan.direction),
            })
          }
        >
          {t("contacts.recordSettlement")}
        </Button>
      )}
    </div>
  );
}

export function ContactDetail({ contactId }: { contactId: string }) {
  const { t } = useTranslation();
  const { data: contacts = [] } = useContacts();
  const contact = contacts.find((c) => c.id === contactId);
  const query = useContactLoans(contactId);

  if (!contact) return null;
  const balance = toAmount(contact.balance);

  return (
    <aside className="flex w-[380px] shrink-0 flex-col gap-4 overflow-y-auto rounded-lg border border-line bg-surface p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink-2">
          <HandCoins className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-ink">{contact.name}</div>
          <div className="truncate text-xs text-ink-3">
            {balance > 0
              ? t("contacts.owesYou")
              : balance < 0
                ? t("contacts.youOwe")
                : t("contacts.settled")}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "amount text-[26px] font-semibold",
          balance > 0 && "text-positive",
          balance < 0 && "text-negative",
          balance === 0 && "text-ink"
        )}
      >
        {money(Math.abs(balance))}
      </div>

      <div className="border-t border-line pt-3.5">
        <span className="eyebrow">{t("contacts.loans")}</span>
        <QueryState
          query={query}
          skeleton={
            <div className="flex flex-col gap-2 py-2">
              <SkeletonBlock className="h-14" />
              <SkeletonBlock className="h-14" />
            </div>
          }
        >
          {(loans) =>
            loans.length === 0 ? (
              <p className="py-3 text-sm text-ink-4">{t("contacts.noLoans")}</p>
            ) : (
              <div className="flex flex-col">
                {loans.map((loan) => (
                  <LoanRow key={loan.id} loan={loan} contactId={contactId} />
                ))}
              </div>
            )
          }
        </QueryState>
      </div>
    </aside>
  );
}
