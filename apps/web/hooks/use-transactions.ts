"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transactionsApi } from "@/lib/api/transactions";
import type {
  CreateTransactionInput,
  ListTransactionsParams,
  Transaction,
} from "@/lib/api/types";
import { extractErrorMessage } from "@/hooks/use-auth";
import { keys } from "@/hooks/query-keys";

interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void;
}

export function useTransactions(filters: ListTransactionsParams = {}) {
  return useQuery({
    queryKey: keys.transactions(filters),
    queryFn: () => transactionsApi.list(filters),
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: keys.transaction(id),
    queryFn: () => transactionsApi.get(id),
    enabled: Boolean(id),
  });
}

function useInvalidateTransactions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.transactionsAll });
    queryClient.invalidateQueries({ queryKey: keys.accounts });
    queryClient.invalidateQueries({ queryKey: keys.contacts });
    queryClient.invalidateQueries({ queryKey: keys.reports.all });
  };
}

export function useCreateTransaction(
  options: MutationOptions<Transaction> = {}
) {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      transactionsApi.create(input),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useDeleteTransaction(options: MutationOptions<void> = {}) {
  const invalidate = useInvalidateTransactions();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
