"use client";

import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { money, toAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/api/types";

export function ContactsList({
  contacts,
  selectedId,
  onSelect,
}: {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border border-line bg-surface">
      {contacts.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-ink-4">{t("contacts.empty")}</p>
      ) : (
        <ul className="flex flex-col">
          {contacts.map((contact) => {
            const balance = toAmount(contact.balance);
            return (
              <li key={contact.id} className="border-b border-line last:border-0">
                <button
                  type="button"
                  onClick={() => onSelect(contact.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper-2",
                    selectedId === contact.id && "bg-paper-2"
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-2 text-ink-2">
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                    {contact.name}
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={cn(
                        "amount block text-sm font-semibold",
                        balance > 0 && "text-positive",
                        balance < 0 && "text-negative",
                        balance === 0 && "text-ink"
                      )}
                    >
                      {money(Math.abs(balance))}
                    </span>
                    <span className="block text-[11px] uppercase tracking-wide text-ink-3">
                      {balance > 0
                        ? t("contacts.owesYou")
                        : balance < 0
                          ? t("contacts.youOwe")
                          : t("contacts.settled")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
