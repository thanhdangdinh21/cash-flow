"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
        )}
        <span className="text-sm font-semibold text-slate-700">{type}</span>
        <Badge variant="secondary" className="ml-1">
          {accounts.length}
        </Badge>
      </button>

      {/* Account rows */}
      {open && (
        <ul className="divide-y divide-slate-100">
          {accounts.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-400">No accounts yet.</li>
          )}
          {accounts.map((account) => (
            <li key={account.id}>
              {/* Main row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {account.name}
                  </span>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {account.currencyCode}
                </Badge>
                <span className="text-sm tabular-nums text-slate-700 shrink-0">
                  {formatBalance(account.currentBalance)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-slate-400 hover:text-slate-700"
                  onClick={() => onEdit(account as AccountEntity)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8 text-slate-400 hover:text-red-600"
                  onClick={() => onDelete(account.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>

              {/* Holdings sub-list */}
              {account.type === "ASSET" &&
                account.holdings &&
                account.holdings.length > 0 && (
                  <ul className="border-t border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
                    {account.holdings.map((h) => (
                      <li
                        key={h.id}
                        className="pl-10 pr-4 py-2 text-xs text-slate-500"
                      >
                        <span className="font-medium text-slate-600">{h.name}</span>
                        {" · "}
                        {parseFloat(h.currentQuantity).toFixed(4)} {h.unitName}
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
    if (!window.confirm("Delete this account? This cannot be undone.")) return;
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
          <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your financial accounts</p>
        </div>
        <Button onClick={handleNewAccount} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New account
        </Button>
      </div>

      {/* Loading / error states */}
      {isLoading && (
        <p className="text-sm text-slate-500">Loading accounts…</p>
      )}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
          Failed to load accounts.
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
