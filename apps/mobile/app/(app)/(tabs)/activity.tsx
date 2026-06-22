import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAccounts, useCategories, useTransactions } from '@/lib/hooks';
import { dayLabel, money, monthYear } from '@/lib/format';
import { txnSign } from '@/lib/txn';
import type { TransactionData } from '@/lib/types';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { ListBlock } from '@/components/ui/ListBlock';
import { Segs } from '@/components/ui/Segs';
import { TxnRow } from '@/components/TxnRow';

interface DayGroup {
  key: string;
  label: string;
  total: number;
  txns: TransactionData[];
}

function groupByDay(items: TransactionData[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const txn of items) {
    const key = txn.date.slice(0, 10);
    const group = map.get(key) ?? { key, label: dayLabel(txn.date), total: 0, txns: [] };
    group.txns.push(txn);
    group.total += txnSign(txn) * parseFloat(txn.amount);
    map.set(key, group);
  }
  return [...map.values()];
}

export default function ActivityScreen() {
  const { t } = useTranslation();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const [filter, setFilter] = useState('all');

  const accountId = filter.startsWith('acc:') ? filter.slice(4) : undefined;
  const categoryId = filter.startsWith('cat:') ? filter.slice(4) : undefined;
  const { data, isLoading } = useTransactions({ accountId, categoryId });

  // Filter chips: All · each wallet account · top categories (design: filter row)
  const chips = useMemo(() => {
    const options: { id: string; label: string }[] = [{ id: 'all', label: t('activity.all') }];
    for (const a of accounts) options.push({ id: `acc:${a.id}`, label: a.name });
    for (const c of categories.slice(0, 4)) options.push({ id: `cat:${c.id}`, label: c.name });
    return options;
  }, [accounts, categories, t]);

  const groups = useMemo(() => groupByDay(data?.items ?? []), [data]);

  return (
    <Page>
      <Head back={false} eyebrow={monthYear()} title={t('activity.title')} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 mb-4"
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <Segs
          options={chips.map((c) => c.id)}
          value={filter}
          onChange={setFilter}
          labels={Object.fromEntries(chips.map((c) => [c.id, c.label]))}
        />
      </ScrollView>

      {isLoading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#181712" />
        </View>
      ) : groups.length === 0 ? (
        <Text className="font-sans text-base text-ink-4 py-12 text-center">
          {t('activity.empty')}
        </Text>
      ) : (
        groups.map((group, gi) => (
          <ListBlock
            key={group.key}
            eyebrow={group.label}
            trailing={
              <Text
                className={`font-sans text-[12.5px] ${group.total > 0 ? 'text-positive' : 'text-ink-3'}`}
                style={{ fontVariant: ['tabular-nums'] }}
              >
                {group.total > 0
                  ? `+ ${money(group.total, { cents: false })}`
                  : `− ${money(Math.abs(group.total), { cents: false })}`}
              </Text>
            }
            className={gi === 0 ? '' : 'mt-4'}
          >
            {group.txns.map((txn, i) => (
              <TxnRow key={txn.id} txn={txn} first={i === 0} />
            ))}
          </ListBlock>
        ))
      )}
    </Page>
  );
}
