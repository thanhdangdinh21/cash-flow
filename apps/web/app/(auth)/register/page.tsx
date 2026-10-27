"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useRegister } from "@/hooks/use-auth";
import { extractErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const register = useRegister({
    toastOnError: false,
    onError: (err) => setError(extractErrorMessage(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    register.mutate(form);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight text-ink">
        {t("auth.register.title")}
      </h2>
      <p className="mt-1.5 mb-6 text-sm text-ink-3">{t("auth.register.subtitle")}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("auth.register.name")}</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder={t("auth.register.namePlaceholder")}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.register.email")}</Label>
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
          <Label htmlFor="password">{t("auth.register.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={t("auth.register.passwordHint")}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
          />
        </div>

        {error && (
          <p className="rounded-md bg-negative-soft px-4 py-2.5 text-sm text-negative" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={register.isPending}>
          {register.isPending ? t("auth.register.submitting") : t("auth.register.submit")}
        </Button>
      </form>

      <p className="mt-4 text-xs leading-relaxed text-ink-3">{t("auth.register.seedNote")}</p>

      <p className="mt-6 text-sm text-ink-2">
        {t("auth.register.hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          {t("auth.register.login")}
        </Link>
      </p>
    </div>
  );
}
