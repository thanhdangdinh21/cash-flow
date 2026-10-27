"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useLogin } from "@/hooks/use-auth";
import { extractErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const login = useLogin({
    toastOnError: false,
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    login.mutate(form);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        {t("auth.login.title")}
      </h2>
      <p className="mt-1.5 mb-6 text-sm text-ink-3">{t("auth.login.subtitle")}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.login.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.login.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
          />
        </div>

        {error && (
          <p className="rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={login.isPending}>
          {login.isPending ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-2">
        {t("auth.login.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-ink hover:underline">
          {t("auth.login.register")}
        </Link>
      </p>
    </div>
  );
}
