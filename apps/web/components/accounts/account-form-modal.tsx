"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
      setError(err.response?.data?.message ?? "Something went wrong");
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
      setError(err.response?.data?.message ?? "Something went wrong");
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
          <DialogTitle>{isEdit ? "Edit account" : "New account"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="acc-name">Name</Label>
            <Input
              id="acc-name"
              placeholder="e.g. Checking Account"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
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
            <Label>Currency</Label>
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
              <Label htmlFor="acc-balance">Initial Balance</Label>
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
                <Label>Holdings</Label>
                <Button type="button" variant="outline" size="sm" onClick={addHolding}>
                  Add holding
                </Button>
              </div>
              {form.holdings.length === 0 && (
                <p className="text-sm text-slate-400">No holdings yet.</p>
              )}
              {form.holdings.map((h) => (
                <div key={h.key} className="flex gap-2 items-center">
                  <Input
                    placeholder="Name (e.g. Gold)"
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
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">{error}</p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
