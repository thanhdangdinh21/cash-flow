"use client";

import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { money, toAmount } from "@/lib/format";
import { useContactLoans } from "@/hooks/use-contacts";
import { cn } from "@/lib/utils";
import type { Contact, LoanDirection } from "@/lib/api/types";

export type DebtDirection = "LENT" | "BORROWED" | "COLLECTED" | "REPAID";

const DEBT_DIRS: { id: DebtDirection; in: boolean; newDebt: boolean }[] = [
  { id: "LENT", in: false, newDebt: true },
  { id: "BORROWED", in: true, newDebt: true },
  { id: "COLLECTED", in: true, newDebt: false },
  { id: "REPAID", in: false, newDebt: false },
];

export function debtDirMeta(id: DebtDirection) {
  const meta = DEBT_DIRS.find((d) => d.id === id);
  if (!meta) throw new RangeError(`Unknown debt direction: ${id}`);
  return meta;
}

const NEW_CONTACT_VALUE = "__new__";

export function DebtFields({
  debtDir,
  onDebtDirChange,
  contacts,
  contactId,
  onContactIdChange,
  newContactName,
  onNewContactNameChange,
  loanId,
  onLoanIdChange,
  interestRate,
  onInterestRateChange,
  interestPeriod,
  onInterestPeriodChange,
  amount,
}: {
  debtDir: DebtDirection;
  onDebtDirChange: (d: DebtDirection) => void;
  contacts: Contact[];
  contactId: string;
  onContactIdChange: (id: string) => void;
  newContactName: string;
  onNewContactNameChange: (name: string) => void;
  loanId: string;
  onLoanIdChange: (id: string) => void;
  interestRate: string;
  onInterestRateChange: (v: string) => void;
  interestPeriod: "yearly" | "monthly";
  onInterestPeriodChange: (v: "yearly" | "monthly") => void;
  amount: number;
}) {
  const { t } = useTranslation();
  const dir = debtDirMeta(debtDir);
  const selectedContact = contacts.find((c) => c.id === contactId);

  const settleDirection: LoanDirection = debtDir === "COLLECTED" ? "LENT" : "BORROWED";
  const { data: contactLoans = [] } = useContactLoans(
    !dir.newDebt ? contactId : "",
    "ACTIVE"
  );
  const settleLoans = contactLoans.filter((l) => l.direction === settleDirection);
  const selectedLoan = settleLoans.find((l) => l.id === loanId);

  return (
    <div className="col-span-2 flex flex-col gap-4">
      <div>
        <Label className="mb-2 block eyebrow">{t("add.direction")}</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {DEBT_DIRS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => {
                onDebtDirChange(d.id);
                onLoanIdChange("");
              }}
              className={cn(
                "rounded-md border px-3 py-2 text-left transition-colors",
                d.id === debtDir
                  ? "border-ink bg-ink text-paper"
                  : "border-line-2 bg-surface text-ink-2 hover:bg-paper-2"
              )}
            >
              <div className="text-sm font-semibold">{t(`add.debt.${d.id}.label`)}</div>
              <div className={cn("text-xs", d.id === debtDir ? "opacity-70" : "text-ink-3")}>
                {t(`add.debt.${d.id}.sub`)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label>{debtDir === "LENT" || debtDir === "COLLECTED" ? t("add.borrower") : t("add.lender")}</Label>
          <Select
            value={contactId}
            onValueChange={(v) => onContactIdChange(v === NEW_CONTACT_VALUE ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("add.pickContact")} />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {toAmount(c.balance) !== 0
                    ? ` · ${t(toAmount(c.balance) > 0 ? "add.owesYou" : "add.youOwe", {
                        amount: money(Math.abs(toAmount(c.balance))),
                      })}`
                    : ""}
                </SelectItem>
              ))}
              {dir.newDebt && (
                <SelectItem value={NEW_CONTACT_VALUE}>{t("add.newContact")}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {dir.newDebt && !contactId ? (
          <div className="flex flex-col gap-1.5">
            <Label className="opacity-0">{t("add.newContact")}</Label>
            <Input
              value={newContactName}
              onChange={(e) => onNewContactNameChange(e.target.value)}
              placeholder={t("add.newContact")}
            />
          </div>
        ) : !dir.newDebt && contactId ? (
          <div className="flex flex-col gap-1.5">
            <Label>{t("add.loan")}</Label>
            <Select value={loanId} onValueChange={onLoanIdChange}>
              <SelectTrigger>
                <SelectValue placeholder={t("add.pickLoan")} />
              </SelectTrigger>
              <SelectContent>
                {settleLoans.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-ink-4">{t("add.noActiveLoans")}</div>
                ) : (
                  settleLoans.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {money(l.principal)} · {t("add.remaining", { amount: money(l.remainingAmount) })}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div />
        )}
      </div>

      {dir.newDebt && (
        <div className="flex items-end gap-3 border-t border-line pt-3.5">
          <div className="flex flex-col gap-1.5">
            <Label>{t("add.interest")}</Label>
            <Input
              value={interestRate}
              onChange={(e) => onInterestRateChange(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="w-24"
            />
          </div>
          <span className="pb-3 text-sm text-ink-3">%</span>
          <div className="flex gap-1.5 pb-0.5">
            {(["yearly", "monthly"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onInterestPeriodChange(p)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  interestPeriod === p
                    ? "border-ink bg-ink text-paper"
                    : "border-line-2 bg-surface text-ink-2 hover:bg-paper-2"
                )}
              >
                {t(`add.${p}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {!dir.newDebt && selectedLoan && amount > 0 && (
        <div className="text-xs text-ink-3">
          {t(debtDir === "COLLECTED" ? "add.remainingHintLent" : "add.remainingHintBorrowed", {
            name: selectedContact?.name,
            total: money(selectedLoan.remainingAmount),
            left: money(Math.max(0, toAmount(selectedLoan.remainingAmount) - amount)),
          })}
        </div>
      )}
    </div>
  );
}
