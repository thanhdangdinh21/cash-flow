"use client";

import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-xl">{t("settings.title")}</h1>

      <section className="bg-surface rounded-lg border border-line p-6 space-y-4">
        <h2 className="eyebrow">{t("settings.language")}</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-2">{t("settings.languageLabel")}</span>
          <LanguageSwitcher />
        </div>
      </section>
    </div>
  );
}
