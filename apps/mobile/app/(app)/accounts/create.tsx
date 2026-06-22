import { useState } from 'react';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CURRENCIES } from '@repo/shared/currencies';
import { api } from '@/lib/api';
import { useMoneyInvalidation } from '@/lib/hooks';
import type { AccountType } from '@/lib/types';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { InputField } from '@/components/ui/Field';
import { Segs } from '@/components/ui/Segs';
import { BlockBtn } from '@/components/ui/BlockBtn';

const TYPES = ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY'] as const;

export default function CreateAccountScreen() {
  const { t } = useTranslation();
  const invalidate = useMoneyInvalidation();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('ASSET');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [initialBalance, setInitialBalance] = useState('');
  const [commodity, setCommodity] = useState(false);
  const [unitName, setUnitName] = useState('');

  const typeLabels = Object.fromEntries(
    TYPES.map((ty) => [ty, t(`accounts.type.${ty}`)]),
  ) as Record<AccountType, string>;

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/accounts', {
        name: name.trim(),
        type,
        currencyCode,
        initialBalance: initialBalance ? parseFloat(initialBalance) : undefined,
        holdings:
          commodity && type === 'ASSET'
            ? [{ name: name.trim(), unitName: unitName.trim() || 'unit' }]
            : undefined,
      }),
    onSuccess: () => {
      invalidate();
      router.back();
    },
    onError: (err: any) =>
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('accounts.failedCreate')),
  });

  function handleSubmit() {
    if (!name.trim()) {
      Alert.alert(t('common.error'), t('accounts.nameRequired'));
      return;
    }
    createMutation.mutate();
  }

  return (
    <Page>
      <Head eyebrow={t('accounts.create.eyebrow')} title={t('accounts.create.title')} />

      <View className="border-t border-line-2">
        <InputField
          first
          label={t('accounts.form.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('accounts.form.namePlaceholder')}
          trailing={<View />}
        />
      </View>

      <View className="pt-4 pb-3.5 border-t border-line">
        <Eyebrow className="mb-2.5 text-[10.5px]">{t('accounts.form.type')}</Eyebrow>
        <Segs
          options={TYPES}
          value={type}
          onChange={(v) => {
            setType(v);
            if (v !== 'ASSET') setCommodity(false);
          }}
          labels={typeLabels}
          wrap
        />
      </View>

      <View className="pt-1 pb-3.5 border-t border-line">
        <Eyebrow className="mt-3 mb-2.5 text-[10.5px]">{t('accounts.form.currency')}</Eyebrow>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Segs
            options={CURRENCIES.map((c) => c.code)}
            value={currencyCode}
            onChange={setCurrencyCode}
          />
        </ScrollView>
        <View className="flex-row items-center gap-2 mt-2.5">
          <Ionicons name="lock-closed-outline" size={13} color="#8C897D" />
          <Text className="font-sans text-[12.5px] text-ink-3">{t('accounts.create.currencyLock')}</Text>
        </View>
      </View>

      <View className="border-t border-line">
        <InputField
          label={t('accounts.form.initialBalance')}
          value={initialBalance}
          onChangeText={setInitialBalance}
          placeholder="0.00"
          keyboardType="decimal-pad"
          trailing={<View />}
        />
      </View>

      {/* Commodity toggle — ASSET only (design: sunken panel) */}
      {type === 'ASSET' ? (
        <View className="bg-paper-2 rounded-lg px-4 py-4 mt-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="font-sans-semibold text-[15px] text-ink">
                {t('accounts.create.commodityTitle')}
              </Text>
              <Text className="font-sans text-[13px] text-ink-3 mt-0.5">
                {t('accounts.create.commodityHint')}
              </Text>
            </View>
            <Switch
              value={commodity}
              onValueChange={setCommodity}
              trackColor={{ true: '#1A7A50', false: '#D8D4C8' }}
            />
          </View>
          {commodity ? (
            <View className="border-t border-line-2 mt-3">
              <InputField
                first
                label={t('accounts.create.unitName')}
                value={unitName}
                onChangeText={setUnitName}
                placeholder={t('accounts.create.unitPlaceholder')}
                autoCapitalize="none"
                trailing={<View />}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="mt-auto pt-6">
        <BlockBtn onPress={handleSubmit} loading={createMutation.isPending}>
          {t('accounts.form.createAccount')}
        </BlockBtn>
      </View>
    </Page>
  );
}
