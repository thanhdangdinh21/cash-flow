"use client";

import { Settings as SettingsIcon, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useUiSettings } from "@/components/ui-settings";
import { useLogout } from "@/hooks/use-auth";

export function SettingsPopover() {
  const { t } = useTranslation();
  const { theme, setTheme, density, setDensity, showKeyHints, setShowKeyHints } =
    useUiSettings();
  const logout = useLogout();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("web.settings.title")}
        >
          <SettingsIcon className="h-[18px] w-[18px]" strokeWidth={2} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="eyebrow mb-3">{t("web.settings.appearance")}</div>

        <div className="flex items-center justify-between gap-3 py-1.5">
          <span className="text-sm font-medium text-ink">
            {t("web.settings.theme")}
          </span>
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label={t("web.settings.theme")}
          />
        </div>

        <div className="flex items-center justify-between gap-3 py-1.5">
          <span className="text-sm font-medium text-ink">
            {t("web.settings.density")}
          </span>
          <Switch
            checked={density === "compact"}
            onCheckedChange={(checked) =>
              setDensity(checked ? "compact" : "comfortable")
            }
            aria-label={t("web.settings.density")}
          />
        </div>

        <div className="flex items-center justify-between gap-3 py-1.5">
          <span className="text-sm font-medium text-ink">
            {t("web.settings.keyHints")}
          </span>
          <Switch
            checked={showKeyHints}
            onCheckedChange={setShowKeyHints}
            aria-label={t("web.settings.keyHints")}
          />
        </div>

        <div className="mt-1 border-t border-line pt-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-ink">
              {t("web.settings.language")}
            </span>
            <LanguageSwitcher />
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut className="h-[14px] w-[14px]" strokeWidth={2} />
            {t("common.signOut")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
