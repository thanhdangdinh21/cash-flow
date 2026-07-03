"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { AxiosError } from "axios";
import { api } from "@/lib/api";
import { authStore } from "@/lib/auth";
import { i18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoLockup } from "@/components/layout/logo";

interface LoginResponse {
  accessToken: string;
  language: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post<LoginResponse>("/auth/login", data).then((r) => r.data),
    onSuccess: ({ accessToken, language }) => {
      authStore.setToken(accessToken);
      i18n.changeLanguage(language);
      router.push("/dashboard");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      setError(err.response?.data?.message ?? t("common.error"));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    mutation.mutate(form);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-paper px-4">
      <LogoLockup />
      <div className="w-full max-w-sm space-y-6 bg-surface p-8 rounded-xl border border-line shadow-sm">
        <div className="space-y-1.5 text-center">
          <h1 className="text-xl">{t("auth.login.title")}</h1>
          <p className="text-sm text-ink-3">
            {t("auth.login.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.login.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-negative bg-negative-soft px-4 py-2.5 rounded-md">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t("auth.login.submitting") : t("auth.login.submit")}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-3">
          {t("auth.login.noAccount")}{" "}
          <Link href="/register" className="text-ink font-semibold hover:underline">
            {t("auth.login.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
