"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesApi } from "@/lib/api/categories";
import type {
  Category,
  CreateCategoryInput,
  CreateSubCategoryInput,
  SubCategory,
  UpdateCategoryInput,
} from "@/lib/api/types";
import { extractErrorMessage } from "@/hooks/use-auth";
import { keys } from "@/hooks/query-keys";

interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void;
}

export function useCategories() {
  return useQuery({
    queryKey: keys.categories,
    queryFn: categoriesApi.list,
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.categories });
    queryClient.invalidateQueries({ queryKey: keys.reports.all });
  };
}

export function useCreateCategory(options: MutationOptions<Category> = {}) {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useUpdateCategory(options: MutationOptions<Category> = {}) {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoriesApi.update(id, input),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useDeleteCategory(options: MutationOptions<void> = {}) {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useAddSubCategory(
  options: MutationOptions<SubCategory> = {}
) {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: CreateSubCategoryInput;
    }) => categoriesApi.addSubCategory(categoryId, input),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useRemoveSubCategory(options: MutationOptions<void> = {}) {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({
      categoryId,
      subId,
    }: {
      categoryId: string;
      subId: string;
    }) => categoriesApi.removeSubCategory(categoryId, subId),
    onSuccess: (data) => {
      invalidate();
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
