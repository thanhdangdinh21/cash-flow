import { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSpendingReport } from '@/lib/hooks';
import { money, monthYear } from '@/lib/format';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { Stat, StatDivider } from '@/components/ui/Stat';
import { Segs } from '@/components/ui/Segs';
import { CategoryIcon, categoryMeta } from '@/components/CategoryIcon';

// Horizontal tinted category bars (design CatBars)
function CatBars({
  items,
  onPressItem,
}: {
  items: { categoryId: string | null; name: string; icon: string | null; amount: number }[];
  onPressItem: (categoryId: string) => void;
}) {
  const max = Math.max(...items.map((i) => i.amount), 1);
  return (
    <View className="gap-3.5">
      {items.map((item) => {
        const meta = categoryMeta(item.icon);
        const inner = (
          <View className="flex-row items-center gap-3">
            <CategoryIcon icon={item.icon} size={34} />
            <View className="flex-1 min-w-0">
              <View className="flex-row justify-between mb-1.5">
                <Text className="font-sans-semibold text-[13.5px] text-ink">{item.name}</Text>
                <Text
                  className="font-sans text-[13px] text-ink-2"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {money(item.amount, { cents: false })}
                </Text>
              </View>
              <View className="h-[7px] rounded-full bg-paper overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${(item.amount / max) * 100}%`, backgroundColor: meta.tint }}
                />
              </View>
            </View>
          </View>
        );
        return item.categoryId ? (
          <TouchableOpacity
            key={item.categoryId}
            activeOpacity={0.7}
            onPress={() => onPressItem(item.categoryId!)}
          >
            {inner}
          </TouchableOpacity>
        ) : (
          <View key="uncategorized">{inner}</View>
        );
      })}
    </View>
  );
}

export default function SpendingScreen() {
  const { t } = useTranslation();
  const [direction, setDirection] = useState<'out' | 'in'>('out');
  const { data: report, isLoading } = useSpendingReport(direction);

  const top = report?.items[0];
  const topShare = report && report.total > 0 && top ? Math.round((top.amount / report.total) * 100) : 0;

  return (
    <Page>
      <Head
        eyebrow={monthYear()}
        title={t('insights.spendingByCategory')}
        trailing={
          <Segs
            options={['out', 'in'] as const}
            value={direction}
            onChange={setDirection}
            labels={{ out: t('home.out'), in: t('home.in') }}
          />
        }
      />

      {isLoading || !report ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#181712" />
        </View>
      ) : (
        <>
          <View className="flex-row gap-4 mb-5">
            <Stat
              big
              label={direction === 'out' ? t('insights.totalOut') : t('insights.totalIn')}
              value={`${direction === 'out' ? '−' : '+'} ${money(report.total, { cents: false })}`}
              tone={direction === 'out' ? 'neg' : 'pos'}
            />
            <StatDivider />
            <Stat big label={t('insights.dailyAverage')} value={money(report.dailyAverage, { cents: false })} />
          </View>

          {report.items.length === 0 ? (
            <Text className="font-sans text-base text-ink-4 py-12 text-center">
              {t('insights.noSpending')}
            </Text>
          ) : (
            <>
              <View className="bg-paper-2 rounded-xl px-4 py-4.5 py-5">
                <CatBars
                  items={report.items}
                  onPressItem={(id) => router.push(`/reports/category/${id}`)}
                />
              </View>
              {top ? (
                <View className="flex-row items-center gap-2.5 mt-3.5">
                  <Ionicons name="pie-chart-outline" size={14} color="#8C897D" />
                  <Text className="flex-1 font-sans text-[13px] text-ink-3">
                    {t('insights.topShare', { name: top.name, pct: topShare })}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </>
      )}
    </Page>
  );
}
