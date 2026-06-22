import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCategoryTrend } from '@/lib/hooks';
import { money, num } from '@/lib/format';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { Stat, StatDivider } from '@/components/ui/Stat';
import { Field } from '@/components/ui/Field';
import { LineChart } from '@/components/charts/LineChart';

// Category trend over 6 months with optional budget compare (design CatTrend)
export default function CategoryTrendScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: report, isLoading } = useCategoryTrend(id);

  if (isLoading || !report) {
    return (
      <Page>
        <Head title="" />
        <View className="py-16 items-center">
          <ActivityIndicator color="#181712" />
        </View>
      </Page>
    );
  }

  const budgetLimit = report.budget ? num(report.budget.monthlyLimit) : null;
  const over = budgetLimit !== null && report.thisMonth > budgetLimit;

  return (
    <Page>
      <Head eyebrow={t('insights.trendEyebrow')} title={report.category.name} />

      <View className="flex-row gap-4 mb-5">
        <Stat big label={t('insights.thisMonthLabel')} value={money(report.thisMonth, { cents: false })} />
        <StatDivider />
        <Stat big label={t('insights.sixMonthAvg')} value={money(report.average, { cents: false })} />
      </View>

      <View className="bg-paper-2 rounded-xl px-3.5 pt-4 pb-3 mb-4.5 mb-5">
        <LineChart data={report.series} stroke="#BE4A30" />
      </View>

      {budgetLimit !== null ? (
        <>
          <View className="border-t border-line-2">
            <Field
              first
              label={t('insights.compareWith')}
              value={`${t('nav.budgets')} · ${money(budgetLimit, { cents: false })} / ${t('insights.perMonth')}`}
              trailing={<View />}
            />
          </View>
          {over ? (
            <View className="flex-row items-center gap-2.5 mt-3.5">
              <Ionicons name="flag-outline" size={14} color="#BE4A30" />
              <Text className="flex-1 font-sans text-[13.5px] text-ink-2">
                {t('insights.overBudget', {
                  name: report.category.name,
                  amount: money(report.thisMonth - budgetLimit, { cents: false }),
                })}
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
