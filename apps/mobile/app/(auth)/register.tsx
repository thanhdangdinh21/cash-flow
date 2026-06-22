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

interface RegisterResponse {
  accessToken: string;
  language: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      api.post<RegisterResponse>('/auth/register', data).then((r) => r.data),
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
        <Head eyebrow={t('auth.register.subtitle')} title={t('auth.register.title')} />

        <View className="border-t border-line-2">
          <InputField
            first
            label={t('auth.register.name')}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder={t('auth.register.namePlaceholder')}
            autoCapitalize="words"
            trailing={<View />}
          />
          <InputField
            label={t('auth.register.email')}
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            trailing={<View />}
          />
          <InputField
            label={t('auth.register.password')}
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
            placeholder={t('auth.register.passwordHint')}
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

        {/* Seeded-accounts note (design: register screen panel) */}
        <View className="bg-paper-2 rounded-lg px-4 py-3.5 mt-5 flex-row gap-3">
          <Ionicons name="wallet-outline" size={18} color="#181712" style={{ marginTop: 1 }} />
          <Text className="flex-1 font-sans text-[13.5px] leading-5 text-ink-2">
            {t('auth.register.seedNote')}
          </Text>
        </View>

        {error ? (
          <View className="bg-negative-soft rounded-md px-4 py-2.5 mt-4">
            <Text className="font-sans text-sm text-negative">{error}</Text>
          </View>
        ) : null}

        <View className="mt-auto pt-6">
          <BlockBtn
            onPress={() => {
              setError('');
              mutation.mutate(form);
            }}
            loading={mutation.isPending}
          >
            {t('auth.register.submit')}
          </BlockBtn>
          <View className="items-center pt-4">
            <Text className="font-sans text-sm text-ink-3">
              {t('auth.register.hasAccount')}{' '}
              <Link href="/(auth)/login" className="font-sans-semibold text-ink">
                {t('auth.register.login')}
              </Link>
            </Text>
          </View>
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}
