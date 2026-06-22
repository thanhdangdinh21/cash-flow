import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useBudgets, useCategories, useMoneyInvalidation } from '@/lib/hooks';
import { monthYear, num } from '@/lib/format';
import type { BudgetData } from '@/lib/types';
import { Page } from '@/components/ui/Page';
import { Head, HeadAction } from '@/components/ui/Head';
import { ListBlock } from '@/components/ui/ListBlock';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Sheet } from '@/components/ui/Sheet';
import { Row } from '@/components/ui/Row';
import { BlockBtn } from '@/components/ui/BlockBtn';
import { CategoryIcon } from '@/components/CategoryIcon';
import { BudgetRow } from '@/components/BudgetRow';

// Create/edit sheet: pick an unbudgeted expense category, set the monthly cap
function BudgetEditor({
  budget,
  visible,
  onClose,
}: {
  budget: BudgetData | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const invalidate = useMoneyInvalidation();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets();
  const [categoryId, setCategoryId] = useState<string | null>(budget?.categoryId ?? null);
  const [limit, setLimit] = useState(budget ? String(num(budget.monthlyLimit)) : '');

  const budgeted = new Set(budgets.map((b) => b.categoryId));
  const available = categories.filter(
    (c) => c.accountType !== 'INCOME' && (!budgeted.has(c.id) || c.id === budget?.categoryId),
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      budget
        ? api.patch(`/budgets/${budget.id}`, { monthlyLimit: parseFloat(limit) })
        : api.post('/budgets', { categoryId, monthlyLimit: parseFloat(limit) }),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (err: any) =>
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.error')),
  });

  const valid = !!categoryId && parseFloat(limit || '0') > 0;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={budget ? t('budgets.editTitle') : t('budgets.newTitle')}
      tall
    >
      {!budget ? (
        <>
          <Eyebrow className="mb-2 text-[10.5px]">{t('add.category')}</Eyebrow>
          {available.map((c, i) => (
            <Row
              key={c.id}
              first={i === 0}
              tile={<CategoryIcon icon={c.icon} size={36} />}
              title={c.name}
              trailing={
                <View
                  className={`w-[22px] h-[22px] rounded-full items-center justify-center ${
                    categoryId === c.id ? 'bg-ink' : 'border-[1.5px] border-line-strong'
                  }`}
                >
                  {categoryId === c.id ? (
                    <Text className="text-paper text-xs leading-none">✓</Text>
                  ) : null}
                </View>
              }
              onPress={() => setCategoryId(c.id)}
            />
          ))}
        </>
      ) : (
        <View className="flex-row items-center gap-3 mb-3">
          <CategoryIcon icon={budget.category.icon} size={40} />
          <Text className="font-sans-semibold text-md text-ink">{budget.category.name}</Text>
        </View>
      )}

      <View className={`pt-3.5 pb-3 ${budget ? '' : 'border-t border-line mt-2'}`}>
        <Eyebrow className="mb-1.5 text-[10.5px]">{t('budgets.monthlyLimit')}</Eyebrow>
        <TextInput
          value={limit}
          onChangeText={setLimit}
          placeholder="0"
          placeholderTextColor="#B6B2A6"
          keyboardType="decimal-pad"
          className="font-sans-semibold text-2xl text-ink p-0"
          style={{ fontVariant: ['tabular-nums'] }}
        />
      </View>

      <BlockBtn
        onPress={() => valid && saveMutation.mutate()}
        loading={saveMutation.isPending}
        disabled={!valid}
      >
        {t('common.save')}
      </BlockBtn>
      <View className="h-2" />
    </Sheet>
  );
}

export default function BudgetsScreen() {
  const { t } = useTranslation();
  const invalidate = useMoneyInvalidation();
  const { data: budgets = [], isLoading } = useBudgets();
  const [editing, setEditing] = useState<BudgetData | null | undefined>(undefined);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: invalidate,
  });

  function confirmDelete(budget: BudgetData) {
    Alert.alert(t('budgets.deleteTitle'), t('budgets.deleteMessage', { name: budget.category.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('txn.delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(budget.id),
      },
    ]);
  }

  return (
    <Page>
      <Head
        back={false}
        eyebrow={monthYear()}
        title={t('budgets.title')}
        trailing={<HeadAction icon="add" onPress={() => setEditing(null)} />}
      />

      {isLoading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#181712" />
        </View>
      ) : budgets.length === 0 ? (
        <Text className="font-sans text-base text-ink-4 py-12 text-center">
          {t('budgets.empty')}
        </Text>
      ) : (
        <ListBlock>
          {budgets.map((b, i) => (
            <BudgetRow
              key={b.id}
              budget={b}
              first={i === 0}
              onPress={() => setEditing(b)}
              onLongPress={() => confirmDelete(b)}
            />
          ))}
        </ListBlock>
      )}

      {editing !== undefined ? (
        <BudgetEditor
          key={editing?.id ?? 'new'}
          budget={editing}
          visible
          onClose={() => setEditing(undefined)}
        />
      ) : null}
    </Page>
  );
}
