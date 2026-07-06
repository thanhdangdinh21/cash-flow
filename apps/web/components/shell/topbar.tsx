"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOverlays } from "@/components/shell/overlays-context";
import { SettingsPopover } from "@/components/shell/settings-popover";

const TITLE_BY_PATH = {
  "/dashboard": "web.nav.dashboard",
  "/transactions": "web.nav.transactions",
  "/accounts": "web.nav.accounts",
  "/categories": "web.nav.categories",
  "/reports": "web.nav.reports",
  "/contacts": "web.nav.contacts",
} as const;

type NavPath = keyof typeof TITLE_BY_PATH;

function titleKeyForPath(pathname: string) {
  const match = (Object.keys(TITLE_BY_PATH) as NavPath[]).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  return TITLE_BY_PATH[match ?? "/dashboard"];
}

export function Topbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const overlays = useOverlays();
  const titleKey = titleKeyForPath(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-6">
      <h1 className="text-lg font-semibold tracking-tight text-ink">
        {t(titleKey)}
      </h1>

      <button
        type="button"
        onClick={overlays.openCommandBar}
        className="ml-4 flex h-9 min-w-52 items-center gap-2 rounded-md border border-line-2 bg-surface px-3 text-sm text-ink-3 transition-colors duration-[120ms] hover:bg-hover-ink"
      >
        <Search className="h-[14px] w-[14px]" strokeWidth={2} />
        <span className="flex-1 text-left">{t("web.shell.search")}</span>
        <span className="kbd-hint eyebrow text-[10px] font-medium normal-case tracking-normal text-ink-4">
          ⌘K
        </span>
      </button>

      <div className="flex-1" />

      <Button
        variant="default"
        size="sm"
        onClick={() => overlays.openAddTransaction()}
      >
        <Plus className="h-[14px] w-[14px]" strokeWidth={2} />
        {t("web.shell.newTransaction")}
        <span className="kbd-hint eyebrow text-[10px] font-medium normal-case tracking-normal opacity-70">
          N
        </span>
      </Button>

      <SettingsPopover />
    </header>
  );
}
