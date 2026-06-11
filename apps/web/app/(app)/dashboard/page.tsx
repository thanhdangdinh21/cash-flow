"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { authStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authStore.isAuthenticated()) router.replace("/login");
  }, [router]);

  function handleLogout() {
    authStore.clearToken();
    router.push("/login");
  }

  return (
    <div className="max-w-xl mx-auto text-center space-y-4 pt-20">
      <p className="eyebrow">Money Flow</p>
      <h1 className="text-2xl">{t("dashboard.title")}</h1>
      <p className="text-ink-3">{t("dashboard.comingSoon")}</p>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        {t("common.signOut")}
      </Button>
    </div>
  );
}
