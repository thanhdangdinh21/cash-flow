"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import { handleMutationError, type MutationOptions } from "@/lib/api/errors";
import { keys } from "@/hooks/query-keys";

function useAuthSuccess() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return (data: AuthResponse) => {
    authStore.setToken(data.accessToken);
    // Drop any cached data from a previous session so signing in as a
    // different account never renders the prior user's data.
    queryClient.clear();
    i18n.changeLanguage(data.language);
    router.replace("/dashboard");
  };
}

export function useLogin(options: MutationOptions<AuthResponse> = {}) {
  const handleSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (data) => {
      handleSuccess(data);
      options.onSuccess?.(data);
    },
    onError: (error) => handleMutationError(error, options),
  });
}

export function useRegister(options: MutationOptions<AuthResponse> = {}) {
  const handleSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (data) => {
      handleSuccess(data);
      options.onSuccess?.(data);
    },
    onError: (error) => handleMutationError(error, options),
  });
}

/** Clears auth state, wipes all cached query data, and returns to /login. */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return () => {
    authStore.clearToken();
    router.replace("/login");
    // Clear after navigation kicks off: clearing while (app) screens still
    // have mounted query observers would trigger immediate refetches of the
    // now-unauthenticated queries before the route change unmounts them.
    setTimeout(() => queryClient.clear(), 0);
  };
}

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: usersApi.me,
  });
}

// Note: callers that change `language` must call `i18n.changeLanguage` in
// their own `onSuccess` — this hook does not apply locale side effects.
export function useUpdateMe(options: MutationOptions<User> = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => usersApi.updateMe(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: keys.me });
      queryClient.invalidateQueries({ queryKey: keys.reports.all });
      options.onSuccess?.(data);
    },
    onError: (error) => handleMutationError(error, options),
  });
}
