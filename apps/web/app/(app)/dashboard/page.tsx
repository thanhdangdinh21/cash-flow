"use client";

import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        {t("dashboard.title")}
      </h2>
      <p className="mt-1.5 text-sm text-ink-3">{t("dashboard.comingSoon")}</p>
    </div>
  );
}
