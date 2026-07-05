"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { contactsApi } from "@/lib/api/contacts";
import type { Contact, CreateContactInput, LoanStatus } from "@/lib/api/types";
import { extractErrorMessage } from "@/hooks/use-auth";
import { keys } from "@/hooks/query-keys";

interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void;
}

export function useContacts() {
  return useQuery({
    queryKey: keys.contacts,
    queryFn: contactsApi.list,
  });
}

export function useContactLoans(contactId: string, status?: LoanStatus) {
  return useQuery({
    queryKey: [...keys.contactLoans(contactId), status] as const,
    queryFn: () => contactsApi.listLoans(contactId, status),
    enabled: Boolean(contactId),
  });
}

export function useCreateContact(options: MutationOptions<Contact> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateContactInput) => contactsApi.create(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: keys.contacts });
      queryClient.invalidateQueries({ queryKey: keys.reports.all });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
