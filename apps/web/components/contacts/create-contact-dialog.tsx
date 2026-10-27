"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateContact } from "@/hooks/use-contacts";
import { extractErrorMessage } from "@/lib/api/errors";

export function CreateContactDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (contactId: string) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createContact = useCreateContact({ toastOnError: false });

  function handleClose() {
    setName("");
    setError(null);
    onClose();
  }

  function handleSave() {
    if (!name.trim()) return;
    setError(null);
    createContact.mutate(
      { name: name.trim() },
      {
        onSuccess: (contact) => {
          setName("");
          onCreated(contact.id);
        },
        onError: (err) => setError(extractErrorMessage(err)),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("contacts.newContact")}</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("contacts.namePlaceholder")}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
          }}
        />

        {error && (
          <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={!name.trim() || createContact.isPending}>
            {t("contacts.newContact")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
