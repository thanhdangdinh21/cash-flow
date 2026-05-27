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
import { api, TOKEN } from "@/lib/api";
import { getI18n } from "@/lib/i18n";

interface LoginResponse {
  accessToken: string;
  language: string;
}

export default function LoginScreen() {
  const router = useRouter();
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
      setError(err.response?.data?.message ?? "Something went wrong");
    },
  });

  function handleSubmit() {
    setError("");
    mutation.mutate(form);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-50"
    >
      <View className="flex-1 justify-center px-6">
        <View className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <Text className="text-2xl font-bold text-slate-900 text-center mb-1">
            Welcome back
          </Text>
          <Text className="text-sm text-slate-500 text-center mb-6">
            Sign in to your account
          </Text>

          <Text className="text-sm font-medium text-slate-700 mb-1.5">Email</Text>
          <TextInput
            className="h-11 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 bg-white mb-4"
            placeholder="you@example.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
          />

          <Text className="text-sm font-medium text-slate-700 mb-1.5">Password</Text>
          <TextInput
            className="h-11 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 bg-white mb-4"
            placeholder="Your password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
          />

          {error ? (
            <View className="bg-red-50 rounded-lg px-3 py-2 mb-4">
              <Text className="text-sm text-red-500">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={mutation.isPending}
            className="h-11 bg-slate-900 rounded-lg items-center justify-center mb-6"
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-sm">Sign in</Text>
            )}
          </TouchableOpacity>

          <Text className="text-sm text-slate-500 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/(auth)/register" className="text-slate-900 font-semibold">
              Create one
            </Link>
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
