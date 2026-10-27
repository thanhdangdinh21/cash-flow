"use client";

import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Gem, Wallet } from "lucide-react";
import { CURRENCIES } from "@repo/shared/currencies";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAccount } from "@/hooks/use-accounts";
import { extractErrorMessage } from "@/lib/api/errors";
import { parseAmountText, sanitizeAmountInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/lib/api/types";

type AccountKind = "cash" | "credit" | "commodity";

const KINDS: { id: AccountKind; icon: typeof Wallet; type: AccountType }[] = [
  { id: "cash", icon: Wallet, type: "ASSET" },
  { id: "credit", icon: CreditCard, type: "LIABILITY" },
  { id: "commodity", icon: Gem, type: "ASSET" },
];

const KIND_TYPE: Record<AccountKind, AccountType> = {
  cash: "ASSET",
  credit: "LIABILITY",
  commodity: "ASSET",
};

function CreateAccountForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const fieldId = useId();
  const createAccount = useCreateAccount({ toastOnError: false });

  const [kind, setKind] = useState<AccountKind>("cash");
  const [name, setName] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [initialBalance, setInitialBalance] = useState("");
  const [unitName, setUnitName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0;

  function handleSave() {
    if (!canSave) {
      setError(t("accounts.nameRequired"));
      return;
    }
    setError(null);

    createAccount.mutate(
      {
        name: name.trim(),
        type: KIND_TYPE[kind],
        currencyCode,
        initialBalance: initialBalance ? parseAmountText(initialBalance) : undefined,
        holdings:
          kind === "commodity"
            ? [{ name: name.trim(), unitName: unitName.trim() || "unit" }]
            : undefined,
      },
      {
        onSuccess: () => onClose(),
        onError: (err: unknown) => setError(extractErrorMessage(err, t("accounts.failedCreate"))),
      }
    );
  }

  return (
    <>
      <DialogTitle>{t("accounts.create.title")}</DialogTitle>

      <div className="flex flex-col gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            aria-pressed={kind === k.id}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
              kind === k.id
                ? "border-ink bg-ink text-paper"
                : "border-line-2 bg-surface text-ink hover:bg-paper-2"
            )}
          >
            <k.icon className="h-[18px] w-[18px] shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{t(`accounts.kind.${k.id}.title`)}</div>
              <div className={cn("text-xs", kind === k.id ? "opacity-70" : "text-ink-3")}>
                {t(`accounts.kind.${k.id}.sub`)}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-name`}>{t("accounts.form.name")}</Label>
          <Input
            id={`${fieldId}-name`}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("accounts.form.namePlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-currency`}>{t("accounts.form.currency")}</Label>
          <Select value={currencyCode} onValueChange={setCurrencyCode}>
            <SelectTrigger id={`${fieldId}-currency`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${fieldId}-balance`}>{t("accounts.form.initialBalance")}</Label>
          <Input
            id={`${fieldId}-balance`}
            value={initialBalance}
            onChange={(e) => setInitialBalance(sanitizeAmountInput(e.target.value))}
            placeholder="0.00"
          />
        </div>

        {kind === "commodity" && (
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor={`${fieldId}-unit`}>{t("accounts.create.unitName")}</Label>
            <Input
              id={`${fieldId}-unit`}
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder={t("accounts.create.unitPlaceholder")}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-ink-3">{t("accounts.create.currencyLock")}</p>

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
        <Button type="button" onClick={handleSave} disabled={createAccount.isPending}>
          {t("accounts.form.createAccount")}
        </Button>
      </div>
    </>
  );
}

export function CreateAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-4 overflow-y-auto">
        <CreateAccountForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
