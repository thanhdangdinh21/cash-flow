"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Transaction } from "./api/types";
import type { TxnTitleLabels } from "./txn";

/** Translated fallbacks for txnTitle, shared by every transaction list. */
export function useTxnTitleLabels(): TxnTitleLabels {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      transfer: t("add.types.transfer"),
      uncategorized: t("web.dashboard.recent.fallbackDescription"),
      openingBalance: t("txn.openingBalance"),
    }),
    [t]
  );
}

/** Secondary line under a transaction title: kind, or the category name. */
export function useTxnCaption(): (txn: Transaction) => string {
  const { t } = useTranslation();
  return (txn) => {
    switch (txn.transactionType) {
      case "TRANSFER":
        return t("add.types.transfer");
      case "LOAN":
        return t("add.types.loan");
      case "OPENING_BALANCE":
        return t("txn.openingBalanceHint");
      default:
        return txn.subCategory?.category.name ?? t("web.dashboard.recent.fallbackDescription");
    }
  };
}
