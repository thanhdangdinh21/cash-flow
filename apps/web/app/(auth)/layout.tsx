"use client";

import { useTranslation } from "react-i18next";
import { LogoLockup } from "@/components/layout/logo";

/**
 * Editorial split shell shared by /login and /register: a wide left panel
 * carrying brand voice (logo, headline, tagline) and a narrower right panel
 * that hosts the actual form.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="hidden flex-1 flex-col justify-between px-16 py-14 lg:flex">
        <LogoLockup />
        <div>
          <h1 className="max-w-xl text-5xl leading-none font-semibold tracking-tighter text-ink text-balance">
            {t("web.auth.headline")}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-2">
            {t("web.auth.subhead")}
          </p>
        </div>
        <div className="eyebrow">{t("web.auth.tagline")}</div>
      </div>
      <div className="flex w-full flex-none flex-col justify-center border-line bg-surface px-6 py-14 sm:px-10 lg:w-[480px] lg:border-l lg:px-16">
        <div className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
          <div className="mb-8 lg:hidden">
            <LogoLockup />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
