"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/use-accounts";
import { useCategories } from "@/hooks/use-categories";
import { useContactLoans, useContacts } from "@/hooks/use-contacts";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { extractErrorMessage } from "@/lib/api/errors";
import { money, parseAmountText, sanitizeAmountInput, toAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  DebtFields,
  debtDirMeta,
  settleDirectionFor,
  type DebtDirection,
} from "@/components/transactions/debt-fields";
import type { AddTransactionPreset, AddTransactionPrefill } from "@/components/shell/overlays-context";
import type { CreateTransactionInput, TransactionType } from "@/lib/api/types";

const TYPE_BY_PRESET: Record<AddTransactionPreset, TransactionType> = {
  expense: "EXPENSE",
  income: "INCOME",
  transfer: "TRANSFER",
  debt: "LOAN",
};

const TYPE_TABS = [
  { id: "EXPENSE", labelKey: "add.types.expense" },
  { id: "INCOME", labelKey: "add.types.income" },
  { id: "TRANSFER", labelKey: "add.types.transfer" },
  { id: "LOAN", labelKey: "add.types.loan" },
] as const satisfies readonly { id: TransactionType; labelKey: string }[];

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function AddTransactionForm({
  preset,
  prefill,
  onClose,
}: {
  preset?: AddTransactionPreset;
  prefill?: AddTransactionPrefill;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: contacts = [] } = useContacts();
  const createTransaction = useCreateTransaction({ toastOnError: false });

  const [type, setType] = useState<TransactionType>(
    prefill?.type ?? (preset ? TYPE_BY_PRESET[preset] : "EXPENSE")
  );
  const [debtDir, setDebtDir] = useState<DebtDirection>("LENT");
  const [amountText, setAmountText] = useState(prefill?.amountText ?? "");
  const [accountId, setAccountId] = useState(prefill?.accountId ?? "");
  const [counterAccountId, setCounterAccountId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState(prefill?.subCategoryId ?? "");
  const [contactId, setContactId] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [loanId, setLoanId] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [interestPeriod, setInterestPeriod] = useState<"yearly" | "monthly">("yearly");
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const walletAccounts = useMemo(
    () => accounts.filter((a) => a.type === "ASSET" || a.type === "LIABILITY"),
    [accounts]
  );

  const scopedCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.accountType === null || c.accountType === (type === "INCOME" ? "INCOME" : "EXPENSE")
      ),
    [categories, type]
  );

  const dir = debtDirMeta(debtDir);
  const amount = parseAmountText(amountText);
  const amountOk = !Number.isNaN(amount) && amount > 0;
  const moneyIn = type === "INCOME" || (type === "LOAN" && dir.in);
  const amountColor = moneyIn ? "text-positive" : type === "EXPENSE" ? "text-negative" : "text-ink";
  const amountPrefix = type === "TRANSFER" ? "$" : moneyIn ? "+ $" : type === "EXPENSE" ? "− $" : "$";

  // Shares a react-query cache key with DebtFields's own fetch — no extra request.
  const { data: contactLoans = [] } = useContactLoans(
    type === "LOAN" && !dir.newDebt ? contactId : "",
    "ACTIVE"
  );
  const selectedLoan = contactLoans.find(
    (l) => l.id === loanId && l.direction === settleDirectionFor(debtDir)
  );

  function validate(): string | null {
    if (!amountOk) return t("add.errors.amount");
    if (!accountId) return t("add.errors.account");
    if (type === "TRANSFER") {
      if (!counterAccountId) return t("add.errors.toAccount");
      if (counterAccountId === accountId) return t("add.errors.sameAccount");
    }
    if (type === "LOAN") {
      if (dir.newDebt && !contactId && !newContactName.trim()) return t("add.errors.contact");
      if (!dir.newDebt && !loanId) return t("add.errors.loan");
      if (!dir.newDebt && selectedLoan && amount > toAmount(selectedLoan.remainingAmount)) {
        return t("add.errors.overRemaining");
      }
    }
    return null;
  }

  const saveLabel =
    type === "TRANSFER"
      ? t("add.save.transfer")
      : type === "LOAN"
        ? dir.newDebt
          ? t("add.save.debt")
          : debtDir === "COLLECTED"
            ? t("add.save.collection")
            : t("add.save.repayment")
        : t("add.save.default");

  function handleSave() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const input: CreateTransactionInput = {
      transactionType: type,
      amount,
      date,
      accountId,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      ...(type !== "LOAN" && subCategoryId && { subCategoryId }),
      ...(type === "TRANSFER" && { counterAccountId }),
      ...(type === "LOAN" &&
        (dir.newDebt
          ? {
              loanDirection: debtDir as "LENT" | "BORROWED",
              ...(contactId ? { contactId } : { contactName: newContactName.trim() }),
              ...(interestRate && {
                interestRate: parseAmountText(interestRate),
                interestPeriod,
              }),
            }
          : { loanId })),
    };

    createTransaction.mutate(input, {
      onSuccess: () => {
        onClose();
      },
      onError: (err: unknown) => {
        setError(extractErrorMessage(err));
      },
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <DialogTitle>{t("add.title")}</DialogTitle>
      </div>

      <div className="flex gap-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setType(tab.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              type === tab.id
                ? "border-ink bg-ink text-paper"
                : "border-line-2 bg-surface text-ink-2 hover:bg-paper-2"
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-1 border-b border-line py-6">
        <span className="eyebrow">{t("add.amount")}</span>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-2xl font-semibold", amountColor)}>{amountPrefix}</span>
          <input
            autoFocus
            value={amountText}
            onChange={(e) => setAmountText(sanitizeAmountInput(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="0.00"
            aria-label={t("add.amount")}
            className={cn(
              "amount border-0 bg-transparent text-5xl font-semibold outline-none",
              amountColor
            )}
            style={{ width: `${Math.max(4, amountText.length + 1)}ch`, maxWidth: 260 }}
          />
        </div>
        {type === "TRANSFER" && (
          <p className="text-xs text-ink-3">{t("add.transferHint")}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        {(type === "EXPENSE" || type === "INCOME") && (
          <>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>{t("add.category")}</Label>
              <Select value={subCategoryId} onValueChange={setSubCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("add.categoryLater")} />
                </SelectTrigger>
                <SelectContent>
                  {scopedCategories.map((c) => (
                    <SelectGroup key={c.id}>
                      <SelectLabel>{c.name}</SelectLabel>
                      {c.subCategories.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>{type === "INCOME" ? t("add.toAccount") : t("add.fromAccount")}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("add.pickAccount")} />
                </SelectTrigger>
                <SelectContent>
                  {walletAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {money(a.currentBalance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {type === "TRANSFER" && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>{t("add.fromAccount")}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("add.pickAccount")} />
                </SelectTrigger>
                <SelectContent>
                  {walletAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {money(a.currentBalance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("add.toAccount")}</Label>
              <Select value={counterAccountId} onValueChange={setCounterAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("add.pickAccount")} />
                </SelectTrigger>
                <SelectContent>
                  {walletAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} · {money(a.currentBalance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {type === "LOAN" && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>{dir.in ? t("add.toAccount") : t("add.fromAccount")}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("add.pickAccount")} />
                </SelectTrigger>
                <SelectContent>
                  {walletAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div />
            <DebtFields
              debtDir={debtDir}
              onDebtDirChange={(d) => {
                setDebtDir(d);
                setLoanId("");
              }}
              contacts={contacts}
              contactId={contactId}
              onContactIdChange={(id) => {
                setContactId(id);
                setLoanId("");
              }}
              newContactName={newContactName}
              onNewContactNameChange={setNewContactName}
              loanId={loanId}
              onLoanIdChange={setLoanId}
              interestRate={interestRate}
              onInterestRateChange={setInterestRate}
              interestPeriod={interestPeriod}
              onInterestPeriodChange={setInterestPeriod}
              amount={amountOk ? amount : 0}
            />
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>{t("add.date")}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("add.description")}</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("add.optional")}
          />
        </div>
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>{t("txn.notes")}</Label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("add.optional")}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2.5 pt-1">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <span className="flex-1" />
        <Button
          type="button"
          onClick={handleSave}
          disabled={createTransaction.isPending}
        >
          {saveLabel}
        </Button>
      </div>
    </>
  );
}

export function AddTransactionModal({
  open,
  preset,
  prefill,
  onClose,
}: {
  open: boolean;
  preset?: AddTransactionPreset;
  prefill?: AddTransactionPrefill;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-xl flex-col gap-4 overflow-y-auto">
        <AddTransactionForm preset={preset} prefill={prefill} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
