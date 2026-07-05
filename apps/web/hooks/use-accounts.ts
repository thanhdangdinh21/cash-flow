"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/accounts";
import type {
  Account,
  CreateAccountInput,
  CreateHoldingInput,
  Holding,
  UpdateAccountInput,
} from "@/lib/api/types";
import { handleMutationError, type MutationOptions } from "@/lib/api/errors";
import { keys } from "@/hooks/query-keys";

export function useAccounts() {
  return useQuery({
    queryKey: keys.accounts,
    queryFn: accountsApi.list,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: keys.account(id),
    queryFn: () => accountsApi.get(id),
    enabled: Boolean(id),
  });
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.accounts });
    queryClient.invalidateQueries({ queryKey: keys.reports.all });
  };
}

export function useCreateAccount(options: MutationOptions<Account> = {}) {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (input: CreateAccountInput) => accountsApi.create(input),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => handleMutationError(error, options),
  });
}

export function useUpdateAccount(options: MutationOptions<Account> = {}) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAccountInput }) =>
      accountsApi.update(id, input),
    onSuccess: (data) => {
      invalidate();
      // Account renames are embedded in cached transactions (debit/credit refs).
      queryClient.invalidateQueries({ queryKey: keys.transactionsAll });
      options.onSuccess?.(data);
    },
    onError: (error) => handleMutationError(error, options),
  });
}

export function useDeleteAccount(options: MutationOptions<void> = {}) {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (id: string) => accountsApi.remove(id),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => handleMutationError(error, options),
  });
}

export function useAddHolding(options: MutationOptions<Holding> = {}) {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({
      accountId,
      input,
    }: {
      accountId: string;
      input: CreateHoldingInput;
    }) => accountsApi.addHolding(accountId, input),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => handleMutationError(error, options),
  });
}

export function useRemoveHolding(options: MutationOptions<void> = {}) {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({
      accountId,
      holdingId,
    }: {
      accountId: string;
      holdingId: string;
    }) => accountsApi.removeHolding(accountId, holdingId),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => handleMutationError(error, options),
  });
}
