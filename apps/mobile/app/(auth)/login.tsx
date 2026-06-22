import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, TOKEN } from '@/lib/api';
import { getI18n } from '@/lib/i18n';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { InputField } from '@/components/ui/Field';
import { BlockBtn } from '@/components/ui/BlockBtn';

interface LoginResponse {
  accessToken: string;
  language: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
    onSuccess: async ({ accessToken, language }) => {
      await TOKEN.set(accessToken);
      await getI18n().changeLanguage(language);
      router.replace('/(app)');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message ?? t('common.error'));
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-paper"
    >
      <Page bottom={36}>
        <Head back={false} eyebrow={t('auth.login.subtitle')} title={t('auth.login.title')} />

        <View className="border-t border-line-2">
          <InputField
            first
            label={t('auth.login.email')}
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            trailing={<View />}
          />
          <InputField
            label={t('auth.login.password')}
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
            placeholder="••••••••••"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            trailing={
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={17}
                  color="#8C897D"
                />
              </TouchableOpacity>
            }
          />
        </View>

        {error ? (
          <View className="bg-negative-soft rounded-md px-4 py-2.5 mt-4">
            <Text className="font-sans text-sm text-negative">{error}</Text>
          </View>
        ) : null}

        <View className="mt-5 mb-1">
          <BlockBtn
            onPress={() => {
              setError('');
              mutation.mutate(form);
            }}
            loading={mutation.isPending}
          >
            {t('auth.login.submit')}
          </BlockBtn>
        </View>

        <View className="mt-auto items-center pt-6">
          <Text className="font-sans text-sm text-ink-3">
            {t('auth.login.noAccount')}{' '}
            <Link href="/(auth)/register" className="font-sans-semibold text-ink">
              {t('auth.login.register')}
            </Link>
          </Text>
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}
