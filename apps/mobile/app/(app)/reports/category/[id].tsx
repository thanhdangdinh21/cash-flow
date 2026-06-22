import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useCategoryTrend } from '@/lib/hooks';
import { money } from '@/lib/format';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { Stat, StatDivider } from '@/components/ui/Stat';
import { LineChart } from '@/components/charts/LineChart';

// Category trend over 6 months (design CatTrend)
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
    </Page>
  );
}
