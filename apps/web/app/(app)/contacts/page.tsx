"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryState, SkeletonBlock } from "@/components/ui/query-state";
import { ContactDetail } from "@/components/contacts/contact-detail";
import { ContactsList } from "@/components/contacts/contacts-list";
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog";
import { useContacts } from "@/hooks/use-contacts";

function ContactsSkeleton() {
  return (
    <div className="flex h-full gap-4">
      <SkeletonBlock className="h-full flex-1" />
      <SkeletonBlock className="h-full w-[380px] shrink-0" />
    </div>
  );
}

export default function ContactsPage() {
  const { t } = useTranslation();
  const query = useContacts();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    // Skip while a refetch is in flight (e.g. right after creating a contact
    // and selecting it optimistically) — otherwise this can reset the
    // selection back to the first contact before the new one has arrived.
    if (!query.data || query.isFetching) return;
    if (selectedId && query.data.some((c) => c.id === selectedId)) return;
    setSelectedId(query.data[0]?.id ?? null);
  }, [query.data, query.isFetching, selectedId]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("contacts.title")}</h2>
          <p className="text-xs text-ink-3">{t("contacts.subtitle")}</p>
        </div>
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          {t("contacts.newContact")}
        </Button>
      </div>

      <QueryState query={query} skeleton={<ContactsSkeleton />}>
        {(contacts) => (
          <div className="flex min-h-0 flex-1 gap-4">
            <ContactsList contacts={contacts} selectedId={selectedId} onSelect={setSelectedId} />
            {selectedId ? (
              <ContactDetail key={selectedId} contactId={selectedId} />
            ) : (
              <aside className="flex w-[380px] shrink-0 items-center justify-center rounded-lg border border-line bg-surface p-5 text-center text-sm text-ink-4">
                {t("contacts.selectHint")}
              </aside>
            )}
          </div>
        )}
      </QueryState>

      <CreateContactDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(contactId) => {
          setCreateOpen(false);
          setSelectedId(contactId);
        }}
      />
    </div>
  );
}
