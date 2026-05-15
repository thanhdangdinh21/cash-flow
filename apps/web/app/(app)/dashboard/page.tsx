"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    if (!authStore.isAuthenticated()) router.replace("/login");
  }, [router]);

  function handleLogout() {
    authStore.clearToken();
    router.push("/login");
  }

  return (
    <div className="text-center space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500">Coming soon — Phase 3</p>
      <Button variant="outline" onClick={handleLogout}>
        Sign out
      </Button>
    </div>
  );
}
