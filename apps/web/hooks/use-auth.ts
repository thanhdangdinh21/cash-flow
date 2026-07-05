"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { authApi } from "@/lib/api/auth";
import { usersApi } from "@/lib/api/users";
import { authStore } from "@/lib/auth";
import { i18n } from "@/lib/i18n";
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  UpdateUserInput,
  User,
} from "@/lib/api/types";
import { keys } from "@/hooks/query-keys";

interface ApiErrorBody {
  message?: string | string[];
}

/** Extracts a human-readable message from an axios error response body. */
export function extractErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  const err = error as AxiosError<ApiErrorBody>;
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.length > 0) return message;
  return fallback;
}

interface AuthMutationOptions {
  onSuccess?: (data: AuthResponse) => void;
}

function useAuthSuccess() {
  const router = useRouter();
  return (data: AuthResponse) => {
    authStore.setToken(data.accessToken);
    i18n.changeLanguage(data.language);
    router.replace("/dashboard");
  };
}

export function useLogin(options: AuthMutationOptions = {}) {
  const handleSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      handleSuccess(data);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

export function useRegister(options: AuthMutationOptions = {}) {
  const handleSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      handleSuccess(data);
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}

/** Clears auth state, wipes all cached query data, and returns to /login. */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return () => {
    authStore.clearToken();
    queryClient.clear();
    router.replace("/login");
  };
}

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: usersApi.me,
  });
}

interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void;
}

export function useUpdateMe(options: MutationOptions<User> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersApi.updateMe(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: keys.me });
      queryClient.invalidateQueries({ queryKey: keys.reports.all });
      options.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
}
