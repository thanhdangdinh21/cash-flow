"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { accountsApi } from "@/lib/api/accounts";
import type {
  Account,
  CreateAccountInput,
  CreateHoldingInput,
  Holding,
  UpdateAccountInput,
} from "@/lib/api/types";
import { extractErrorMessage } from "@/hooks/use-auth";
import { keys } from "@/hooks/query-keys";

interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void;
}

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
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useUpdateAccount(options: MutationOptions<Account> = {}) {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAccountInput }) =>
      accountsApi.update(id, input),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
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
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
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
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
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
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
