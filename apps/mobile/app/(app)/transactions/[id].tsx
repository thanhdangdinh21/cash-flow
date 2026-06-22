import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDeleteTransaction, useTransaction } from '@/lib/hooks';
import { fieldDate, money, num } from '@/lib/format';
import { txnSign, txnTitle } from '@/lib/txn';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { ListBlock } from '@/components/ui/ListBlock';
import { Field } from '@/components/ui/Field';
import { Eyebrow } from '@/components/ui/Eyebrow';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: txn, isLoading } = useTransaction(id);
  const deleteMutation = useDeleteTransaction();

  if (isLoading || !txn) {
    return (
      <Page>
        <Head title="" />
        <View className="py-16 items-center">
          <ActivityIndicator color="#181712" />
        </View>
      </Page>
    );
  }

  const sign = txnSign(txn);
  const amount = num(txn.amount);
  const date = new Date(txn.date);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  // Plain-language double entry: money moved From (credit leg) → To (debit leg).
  // System legs read as "General expense · Groceries" instead of raw bookkeeping.
  const categoryLabel = txn.subCategory
    ? `${txn.subCategory.category.name} · ${txn.subCategory.name}`
    : null;
  const fromLabel = txn.creditAccount.isSystem
    ? categoryLabel
      ? `${txn.creditAccount.name} · ${txn.subCategory!.category.name}`
      : txn.creditAccount.name
    : txn.creditAccount.name;
  const toLabel = txn.debitAccount.isSystem
    ? categoryLabel
      ? `${txn.debitAccount.name} · ${txn.subCategory!.category.name}`
      : txn.debitAccount.name
    : txn.debitAccount.name;

  const typeKeys = {
    EXPENSE: 'add.types.expense',
    INCOME: 'add.types.income',
    TRANSFER: 'add.types.transfer',
    LOAN: 'add.types.loan',
  } as const;
  const eyebrow =
    categoryLabel ??
    (txn.transactionType === 'LOAN'
      ? `${t('add.types.loan')}${txn.contact ? ` · ${txn.contact.name}` : ''}`
      : t(typeKeys[txn.transactionType]));

  function handleDelete() {
    Alert.alert(t('txn.deleteTitle'), t('txn.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('txn.delete'),
        style: 'destructive',
        onPress: () =>
          deleteMutation.mutate(txn!.id, {
            onSuccess: () => router.back(),
            onError: (err: any) =>
              Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.error')),
          }),
      },
    ]);
  }

  return (
    <Page>
      <Head eyebrow={eyebrow} title={txnTitle(txn)} />

      <Text
        className={`font-sans-semibold ${sign > 0 ? 'text-positive' : 'text-ink'}`}
        style={{ fontSize: 44, letterSpacing: -1.3, fontVariant: ['tabular-nums'] }}
      >
        {sign === 0
          ? money(amount)
          : sign > 0
            ? `+ ${money(amount)}`
            : `− ${money(amount)}`}
      </Text>
      <Text className="font-sans text-sm text-ink-3 mt-1.5 mb-5">
        {fieldDate(date)} · {time}
      </Text>

      <ListBlock>
        <Field first label={t('txn.fromAccount')} value={fromLabel ?? '—'} trailing={<View />} />
        <Field label={t('txn.to')} value={toLabel ?? '—'} trailing={<View />} />
        {txn.description ? (
          <Field label={t('add.description')} value={txn.description} trailing={<View />} />
        ) : null}
        {txn.notes ? <Field label={t('txn.notes')} value={txn.notes} trailing={<View />} /> : null}
        {txn.loan ? (
          <Field
            label={t('add.loan')}
            value={`${t(`add.debt.${txn.loan.direction}.label`)} · ${t('add.remaining', {
              amount: money(num(txn.loan.remainingAmount)),
            })}`}
            trailing={<View />}
          />
        ) : null}
      </ListBlock>

      {/* Attachments — placeholder (no upload in v1) */}
      <Eyebrow className="mt-5 mb-2.5 text-[10.5px]">{t('txn.attachment')}</Eyebrow>
      <View className="flex-row gap-2.5">
        <View
          className="w-[92px] h-[116px] rounded-md items-center justify-center gap-2"
          style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C4BFB1' }}
        >
          <Ionicons name="camera-outline" size={20} color="#8C897D" />
          <Text className="font-sans-semibold text-[11.5px] text-ink-3">{t('txn.addAttachment')}</Text>
        </View>
      </View>

      <View className="mt-auto pt-6 flex-row items-center justify-between">
        <Text className="font-mono text-[11px] text-ink-3">
          #{txn.id.slice(0, 8).toUpperCase()}
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.7}
          className="flex-row items-center gap-2"
        >
          {deleteMutation.isPending ? (
            <ActivityIndicator size="small" color="#BE4A30" />
          ) : (
            <Ionicons name="trash-outline" size={15} color="#BE4A30" />
          )}
          <Text className="font-sans-semibold text-[13.5px] text-negative">{t('txn.delete')}</Text>
        </TouchableOpacity>
      </View>
    </Page>
  );
}
