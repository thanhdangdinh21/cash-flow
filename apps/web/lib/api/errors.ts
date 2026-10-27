// Shared mutation-hook plumbing: API error message extraction and the
// caller-facing options shape used by every mutation hook in apps/web/hooks.

import axios from "axios";
import { toast } from "sonner";
import { i18n } from "@/lib/i18n";

/**
 * Options accepted by every mutation hook.
 * - `onSuccess` runs after the hook's own invalidation logic.
 * - `onError` runs after the hook's built-in error handling.
 * - `toastOnError` (default true) — set false to suppress the built-in
 *   `toast.error` when the caller renders the error itself.
 */
export interface MutationOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
  toastOnError?: boolean;
}

interface ApiErrorBody {
  message?: string | string[];
}

/**
 * Extracts a human-readable message from an API error. NestJS validation
 * errors send `message` as string[]; other API errors send a string.
 * Fallback resolves at call time so it follows the active locale.
 */
export function extractErrorMessage(error: unknown, fallback?: string): string {
  const fb = fallback ?? i18n.t("common.error");
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.length > 0) return message;
    return fb;
  }
  if (error instanceof Error && error.message) return error.message;
  return fb;
}

/**
 * Standard mutation onError behavior: toast (unless opted out), then the
 * caller's own onError. Keeps ordering consistent across all hooks.
 */
export function handleMutationError<TData>(
  error: unknown,
  options: MutationOptions<TData>
): void {
  if (options.toastOnError !== false) {
    toast.error(extractErrorMessage(error));
  }
  options.onError?.(error);
}
