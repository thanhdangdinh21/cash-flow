"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contactsApi } from "@/lib/api/contacts";
import type { Contact, CreateContactInput, LoanStatus } from "@/lib/api/types";
import { handleMutationError, type MutationOptions } from "@/lib/api/errors";
import { keys } from "@/hooks/query-keys";

export function useContacts() {
  return useQuery({
    queryKey: keys.contacts,
    queryFn: contactsApi.list,
  });
}

export function useContactLoans(contactId: string, status?: LoanStatus) {
  return useQuery({
    queryKey: keys.contactLoans(contactId, status),
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
    onError: (error) => handleMutationError(error, options),
  });
}
