"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, Pencil, Trash2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountFormModal, type AccountEntity } from "@/components/accounts/account-form-modal";

interface HoldingData {
  id: string;
  name: string;
  unitName: string;
  currentQuantity: string;
  currentCost: string;
}

interface AccountData {
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

const TYPE_ORDER = ["ASSET", "LIABILITY", "INCOME", "EXPENSE", "EQUITY"] as const;

function formatBalance(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

interface SectionProps {
  type: string;
  accounts: AccountData[];
  onEdit: (account: AccountEntity) => void;
  onDelete: (id: string) => void;
}

function AccountSection({ type, accounts, onEdit, onDelete }: SectionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-surface border border-line rounded-lg overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-5 py-3.5 bg-paper-2 hover:bg-press-ink transition-colors duration-[120ms] text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-ink-3 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-ink-3 shrink-0" />
        )}
        <span className="eyebrow">{type}</span>
        <Badge variant="secondary" className="ml-1">
          {accounts.length}
        </Badge>
      </button>

      {/* Account rows */}
      {open && (
        <ul className="divide-y divide-line">
          {accounts.length === 0 && (
            <li className="px-5 py-3.5 text-sm text-ink-4">{t("accounts.empty")}</li>
          )}
          {accounts.map((account) => (
            <li key={account.id}>
              {/* Main row */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-ink truncate">
                    {account.name}
                  </span>
                </div>
                <Badge variant="outline" className="shrink-0 font-mono text-2xs">
                  {account.currencyCode}
                </Badge>
                <span
                  className={`amount text-sm font-semibold shrink-0 ${
                    parseFloat(account.currentBalance) < 0 ? "text-negative" : "text-ink"
                  }`}
                >
                  {formatBalance(account.currentBalance)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-9 w-9 text-ink-3 hover:text-ink"
                  onClick={() => onEdit(account as AccountEntity)}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">{t("common.save")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-9 w-9 text-ink-3 hover:text-negative"
                  onClick={() => onDelete(account.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t("accounts.form.remove")}</span>
                </Button>
              </div>

              {/* Holdings sub-list */}
              {account.type === "ASSET" &&
                account.holdings &&
                account.holdings.length > 0 && (
                  <ul className="border-t border-line bg-surface-2 divide-y divide-line">
                    {account.holdings.map((h) => (
                      <li
                        key={h.id}
                        className="pl-11 pr-5 py-2.5 text-xs text-ink-3"
                      >
                        <span className="font-medium text-ink-2">{h.name}</span>
                        {" · "}
                        <span className="amount">
                          {parseFloat(h.currentQuantity).toFixed(4)} {h.unitName}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountEntity | undefined>(undefined);

  const { data: accounts = [], isLoading, error } = useQuery<AccountData[]>({
    queryKey: ["accounts"],
    queryFn: () => api.get("/accounts").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  function handleDelete(id: string) {
    if (!window.confirm(t("accounts.deleteConfirm"))) return;
    deleteMutation.mutate(id);
  }

  function handleEdit(account: AccountEntity) {
    setEditingAccount(account);
    setModalOpen(true);
  }

  function handleNewAccount() {
    setEditingAccount(undefined);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditingAccount(undefined);
  }

  // Group accounts by type in defined order
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    accounts: accounts.filter((a) => a.type === type),
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl">{t("accounts.title")}</h1>
          <p className="text-sm text-ink-3 mt-1">{t("accounts.subtitle")}</p>
        </div>
        <Button onClick={handleNewAccount} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t("accounts.newAccount")}
        </Button>
      </div>

      {/* Loading / error states */}
      {isLoading && (
        <p className="text-sm text-ink-3">{t("accounts.loading")}</p>
      )}
      {error && (
        <p className="text-sm text-negative bg-negative-soft px-4 py-2.5 rounded-md">
          {t("accounts.loadError")}
        </p>
      )}

      {/* Sections */}
      {!isLoading && (
        <div className="space-y-4">
          {grouped.map(({ type, accounts: accs }) => (
            <AccountSection
              key={type}
              type={type}
              accounts={accs}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Account form modal */}
      <AccountFormModal
        open={modalOpen}
        onClose={handleModalClose}
        account={editingAccount}
      />
    </div>
  );
}
