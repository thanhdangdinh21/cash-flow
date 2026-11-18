import type { TFunction } from "i18next";
import { money } from "./format";
import type { NetWorthSummary } from "./api/types";

/**
 * "Owed to you $X · You owe $Y" under a net-worth figure, listing only the
 * non-zero parts. Null when nothing is owed either way.
 */
export function owedLine(
  summary: Pick<NetWorthSummary, "owedToYou" | "youOwe">,
  t: TFunction,
): string | null {
  const parts: string[] = [];
  if (summary.owedToYou !== 0)
    parts.push(t("netWorth.owedToYou", { amount: money(summary.owedToYou) }));
  if (summary.youOwe !== 0)
    parts.push(t("netWorth.youOwe", { amount: money(summary.youOwe) }));
  return parts.length > 0 ? parts.join(" · ") : null;
}
