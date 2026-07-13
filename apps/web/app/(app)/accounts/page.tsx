"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { AccountInspector } from "@/components/accounts/account-inspector";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { useAccounts } from "@/hooks/use-accounts";
import { useOverlays } from "@/components/shell/overlays-context";

function AccountsSkeleton() {
  return (
    <div className="flex h-full gap-4">
      <SkeletonBlock className="h-full flex-1" />
      <SkeletonBlock className="h-full w-[340px] shrink-0" />
    </div>
  );
}

export default function AccountsPage() {
  const { t } = useTranslation();
  const overlays = useOverlays();
  const query = useAccounts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!query.data) return;
    if (selectedId && query.data.some((a) => a.id === selectedId)) return;
    setSelectedId(query.data[0]?.id ?? null);
  }, [query.data, selectedId]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="sr-only">{t("accounts.title")}</h2>
        <Button type="button" size="sm" onClick={() => overlays.openCreateAccount()}>
          <Plus className="h-3.5 w-3.5" />
          {t("accounts.newAccount")}
        </Button>
      </div>

      <QueryState query={query} skeleton={<AccountsSkeleton />}>
        {(accounts) => (
          <div className="flex min-h-0 flex-1 gap-4">
            <AccountsTable accounts={accounts} selectedId={selectedId} onSelect={setSelectedId} />
            {selectedId ? (
              <AccountInspector
                key={selectedId}
                accountId={selectedId}
                onDeleted={() => setSelectedId(null)}
              />
            ) : (
              <aside className="flex w-[340px] shrink-0 items-center justify-center rounded-lg border border-line bg-surface p-5 text-center text-sm text-ink-4">
                {t("web.accounts.selectHint")}
              </aside>
            )}
          </div>
        )}
      </QueryState>
    </div>
  );
}
