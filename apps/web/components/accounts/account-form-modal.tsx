"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";
import { api } from "@/lib/api";
import { CURRENCIES } from "@repo/shared/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface HoldingData {
  id: string;
  name: string;
  unitName: string;
  currentQuantity: string;
  currentCost: string;
}

export interface AccountEntity {
  id: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "EQUITY";
  currencyCode: string;
  initialBalance: string;
  currentBalance: string;
  isActive: boolean;
  isDefault: boolean;
  holdings: HoldingData[];
}

interface AccountFormModalProps {
  open: boolean;
  onClose: () => void;
  account?: AccountEntity;
}

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"] as const;

interface HoldingRow {
  key: string;
  name: string;
  unitName: string;
}

interface FormState {
  name: string;
  type: "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "EQUITY";
  currencyCode: string;
  initialBalance: string;
  holdings: HoldingRow[];
}

function makeHoldingRow(): HoldingRow {
  return { key: crypto.randomUUID(), name: "", unitName: "" };
}

export function AccountFormModal({ open, onClose, account }: AccountFormModalProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const isEdit = Boolean(account);

  const [form, setForm] = useState<FormState>({
    name: "",
    type: "ASSET",
    currencyCode: "USD",
    initialBalance: "0",
    holdings: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (account) {
        setForm({
          name: account.name,
          type: account.type,
          currencyCode: account.currencyCode,
          initialBalance: account.initialBalance,
          holdings: [],
        });
      } else {
        setForm({
          name: "",
          type: "ASSET",
          currencyCode: "USD",
          initialBalance: "0",
          holdings: [],
        });
      }
      setError("");
    }
  }, [open, account]);

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      type: string;
      currencyCode: string;
      initialBalance: number;
      holdings: { name: string; unitName: string }[];
    }) => api.post("/accounts", data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onClose();
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      setError(err.response?.data?.message ?? t("common.error"));
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      api.patch(`/accounts/${account!.id}`, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onClose();
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      setError(err.response?.data?.message ?? t("common.error"));
    },
  });

  const isPending = createMutation.isPending || editMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (isEdit) {
      editMutation.mutate({ name: form.name });
    } else {
      createMutation.mutate({
        name: form.name,
        type: form.type,
        currencyCode: form.currencyCode,
        initialBalance: parseFloat(form.initialBalance) || 0,
        holdings: form.holdings
          .filter((h) => h.name.trim())
          .map((h) => ({ name: h.name.trim(), unitName: h.unitName.trim() })),
      });
    }
  }

  function addHolding() {
    setForm((prev) => ({ ...prev, holdings: [...prev.holdings, makeHoldingRow()] }));
  }

  function removeHolding(key: string) {
    setForm((prev) => ({ ...prev, holdings: prev.holdings.filter((h) => h.key !== key) }));
  }

  function updateHolding(key: string, field: "name" | "unitName", value: string) {
    setForm((prev) => ({
      ...prev,
      holdings: prev.holdings.map((h) => (h.key === key ? { ...h, [field]: value } : h)),
    }));
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("accounts.form.editTitle") : t("accounts.form.newTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-name">{t("accounts.form.name")}</Label>
            <Input
              id="acc-name"
              placeholder={t("accounts.form.namePlaceholder")}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>{t("accounts.form.type")}</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  type: v as FormState["type"],
                }))
              }
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <Label>{t("accounts.form.currency")}</Label>
            <Select
              value={form.currencyCode}
              onValueChange={(v) => setForm((prev) => ({ ...prev, currencyCode: v }))}
              disabled={isEdit}
            >
              <SelectTrigger>
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

          {/* Initial Balance */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="acc-balance">{t("accounts.form.initialBalance")}</Label>
              <Input
                id="acc-balance"
                type="number"
                step="any"
                placeholder="0"
                value={form.initialBalance}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, initialBalance: e.target.value }))
                }
              />
            </div>
          )}

          {/* Holdings — ASSET + create mode only */}
          {!isEdit && form.type === "ASSET" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("accounts.form.holdings")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addHolding}>
                  {t("accounts.form.addHolding")}
                </Button>
              </div>
              {form.holdings.length === 0 && (
                <p className="text-sm text-ink-4">{t("accounts.form.noHoldings")}</p>
              )}
              {form.holdings.map((h) => (
                <div key={h.key} className="flex gap-2 items-center">
                  <Input
                    placeholder={t("accounts.form.name")}
                    value={h.name}
                    onChange={(e) => updateHolding(h.key, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Unit (e.g. gram)"
                    value={h.unitName}
                    onChange={(e) => updateHolding(h.key, "unitName", e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHolding(h.key)}
                    className="text-negative hover:text-negative-2 hover:bg-negative-soft shrink-0"
                  >
                    {t("accounts.form.remove")}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-negative bg-negative-soft px-4 py-2.5 rounded-md">{error}</p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t("accounts.form.saving")
                : isEdit
                  ? t("accounts.form.saveChanges")
                  : t("accounts.form.createAccount")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
