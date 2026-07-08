"use client";

import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared loading/error/success wrapper around a react-query result.
 *
 * - While loading: renders `skeleton` (or a default pulse block).
 * - On error with no cached data: renders an inline message with a retry
 *   button that calls `query.refetch()`. If cached data exists despite the
 *   error (failed background refetch), the data keeps rendering.
 * - On success: renders `children(data)` — a function so screens keep full
 *   control of layout without extra intermediate wrapper divs.
 *
 * Every later data screen (transactions, accounts, categories, reports,
 * contacts) reuses this instead of hand-rolling loading/error branches.
 */
export function QueryState<TData>({
  query,
  skeleton,
  children,
}: {
  query: Pick<UseQueryResult<TData>, "data" | "isPending" | "isError" | "refetch" | "isRefetching">;
  skeleton?: ReactNode;
  children: (data: TData) => ReactNode;
}) {
  const { t } = useTranslation();

  if (query.isPending) {
    return <>{skeleton ?? <DefaultSkeleton />}</>;
  }

  // Only surface the error panel when there is nothing to show. A failed
  // background refetch (isError with data still cached) keeps rendering the
  // stale data — otherwise a network blip on tab refocus wipes a populated
  // screen.
  if (query.data === undefined) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-line bg-surface px-6 py-12 text-center">
        <p className="text-sm text-ink-3">{t("common.error")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
          disabled={query.isRefetching}
        >
          <RefreshCw className={cn("h-3.5 w-3.5", query.isRefetching && "animate-spin")} strokeWidth={2} />
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return <>{children(query.data)}</>;
}

function DefaultSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-24 rounded-lg bg-paper-2" />
      <div className="h-64 rounded-lg bg-paper-2" />
    </div>
  );
}

/** Small skeleton block — compose in screen-specific skeleton layouts. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-paper-2", className)} />;
}
