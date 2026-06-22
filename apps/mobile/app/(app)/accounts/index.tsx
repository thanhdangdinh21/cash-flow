import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useAccounts, useMoneyInvalidation } from '@/lib/hooks';
import { money, num } from '@/lib/format';
import type { AccountData, AccountType } from '@/lib/types';
import { Page } from '@/components/ui/Page';
import { Head, HeadAction } from '@/components/ui/Head';
import { ListBlock } from '@/components/ui/ListBlock';
import { Row } from '@/components/ui/Row';
import { Tile } from '@/components/ui/Tile';

const TYPE_ORDER: AccountType[] = ['ASSET', 'LIABILITY', 'INCOME', 'EXPENSE', 'EQUITY'];

const TYPE_ICONS: Record<AccountType, 'wallet-outline' | 'card-outline' | 'trending-up' | 'receipt-outline' | 'business-outline'> = {
  ASSET: 'wallet-outline',
  LIABILITY: 'card-outline',
  INCOME: 'trending-up',
  EXPENSE: 'receipt-outline',
  EQUITY: 'business-outline',
};

function Amount({ value, currency, dim = false }: { value: number; currency: string; dim?: boolean }) {
  return (
    <Text
      className={`font-sans-semibold text-[15px] ${
        value < 0 ? 'text-negative' : dim ? 'text-ink-3' : 'text-ink'
      }`}
      style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.15 }}
    >
      {value < 0 ? `− ${money(Math.abs(value), { currency })}` : money(value, { currency })}
    </Text>
  );
}

export default function AccountsListScreen() {
  const { t } = useTranslation();
  const { data: accounts = [], isLoading } = useAccounts();
  const invalidate = useMoneyInvalidation();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: invalidate,
    onError: (err: any) =>
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('accounts.failedDelete')),
  });

  function confirmDelete(account: AccountData) {
    Alert.alert(t('accounts.deleteTitle'), t('accounts.deleteMessage', { name: account.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('accounts.form.remove'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(account.id),
      },
    ]);
  }

  function accountSub(a: AccountData): string {
    if (a.holdings?.length) {
      const h = a.holdings[0];
      return `${num(h.currentQuantity)} ${h.unitName} · ${t('accounts.commodity')}`;
    }
    if (a.isDefault) return t('accounts.defaultAccount');
    return t(`accounts.type.${a.type}`);
  }

  const groups = TYPE_ORDER.map((type) => ({
    type,
    items: accounts.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <Page>
      <Head
        eyebrow={t('accounts.subtitle')}
        title={t('accounts.title')}
        trailing={<HeadAction icon="add" onPress={() => router.push('/accounts/create')} />}
      />

      {isLoading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#181712" />
        </View>
      ) : groups.length === 0 ? (
        <Text className="font-sans text-base text-ink-4 py-12 text-center">
          {t('accounts.noAccountsHint')}
        </Text>
      ) : (
        groups.map((group, gi) => (
          <ListBlock
            key={group.type}
            eyebrow={t(`accounts.group.${group.type}`)}
            trailing={
              <Text
                className="font-sans-semibold text-[13px] text-ink-3"
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {money(
                  group.items.reduce((s, a) => s + num(a.currentBalance), 0),
                  { currency: group.items[0]?.currencyCode },
                )}
              </Text>
            }
            className={gi === 0 ? '' : 'mt-4'}
          >
            {group.items.map((a, i) => (
              <Row
                key={a.id}
                first={i === 0}
                tile={<Tile icon={TYPE_ICONS[a.type]} />}
                title={a.name}
                sub={accountSub(a)}
                trailing={<Amount value={num(a.currentBalance)} currency={a.currencyCode} />}
                onPress={() => router.push(`/accounts/${a.id}`)}
                onLongPress={() => confirmDelete(a)}
              />
            ))}
          </ListBlock>
        ))
      )}

      <View className="flex-row items-center gap-2.5 mt-4">
        <Ionicons name="trash-outline" size={15} color="#8C897D" />
        <Text className="flex-1 font-sans text-[13px] text-ink-3">{t('accounts.deletedNote')}</Text>
      </View>
    </Page>
  );
}
