import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, TOKEN } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

interface LoginResponse {
  accessToken: string;
  language: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post<LoginResponse>("/auth/login", data).then((r) => r.data),
    onSuccess: async ({ accessToken, language }) => {
      await TOKEN.set(accessToken);
      await getI18n().changeLanguage(language);
      router.replace("/(app)");
    },
    onError: (err: any) => {
      setError(err.response?.data?.message ?? t("common.error"));
    },
  });

  function handleSubmit() {
    setError("");
    mutation.mutate(form);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-paper"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="font-mono-semibold text-2xs uppercase tracking-[2px] text-ink-3 text-center mb-6">
          Money Flow
        </Text>
        <View className="bg-surface rounded-xl p-8 border border-line">
          <Text className="font-sans-semibold text-xl text-ink text-center mb-1 tracking-tight">
            {t("auth.login.title")}
          </Text>
          <Text className="font-sans text-sm text-ink-3 text-center mb-6">
            {t("auth.login.subtitle")}
          </Text>

          <Text className="font-sans-medium text-sm text-ink mb-1.5">{t("auth.login.email")}</Text>
          <TextInput
            className="h-12 border border-line-2 rounded-md px-4 font-sans text-base text-ink bg-surface mb-4"
            placeholder="you@example.com"
            placeholderTextColor="#B6B2A6"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
          />

          <Text className="font-sans-medium text-sm text-ink mb-1.5">{t("auth.login.password")}</Text>
          <TextInput
            className="h-12 border border-line-2 rounded-md px-4 font-sans text-base text-ink bg-surface mb-4"
            placeholder="Your password"
            placeholderTextColor="#B6B2A6"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
          />

          {error ? (
            <View className="bg-negative-soft rounded-md px-4 py-2.5 mb-4">
              <Text className="font-sans text-sm text-negative">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={mutation.isPending}
            activeOpacity={0.85}
            className="h-12 bg-ink rounded-md items-center justify-center mb-6"
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FAF9F6" />
            ) : (
              <Text className="font-sans-semibold text-paper text-base">{t("auth.login.submit")}</Text>
            )}
          </TouchableOpacity>

          <Text className="font-sans text-sm text-ink-3 text-center">
            {t("auth.login.noAccount")}{" "}
            <Link href="/(auth)/register" className="font-sans-semibold text-ink">
              {t("auth.login.register")}
            </Link>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
