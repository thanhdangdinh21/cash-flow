import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAccounts, useNetWorthReport } from '@/lib/hooks';
import { money, num } from '@/lib/format';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ListBlock } from '@/components/ui/ListBlock';
import { Row } from '@/components/ui/Row';
import { Tile } from '@/components/ui/Tile';
import { Segs } from '@/components/ui/Segs';
import { LineChart } from '@/components/charts/LineChart';
import { GhostChart } from '@/components/charts/GhostChart';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Insights home — net worth hero + balances (design ReportsHome)
export default function InsightsScreen() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  const { data: report, isLoading } = useNetWorthReport(period);
  const { data: accounts = [] } = useAccounts();

  const assets = accounts.filter((a) => a.type === 'ASSET').slice(0, 4);
  const series = report?.series ?? [];
  const monthDelta =
    series.length >= 2 ? series[series.length - 1].value - series[series.length - 2].value : 0;
  // First run — nothing to report yet (seeded accounts arrive empty)
  const isFirstRun = !!report && report.current === 0 && series.every((p) => p.value === 0);

  return (
    <Page>
      <Head
        back={false}
        eyebrow={t('insights.eyebrow')}
        title={t('insights.title')}
        trailing={
          isFirstRun ? undefined : (
            <Segs
              options={['month', 'year'] as const}
              value={period}
              onChange={setPeriod}
              labels={{ month: t('insights.month'), year: t('insights.year') }}
            />
          )
        }
      />

      {isLoading || !report ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#181712" />
        </View>
      ) : isFirstRun ? (
        <InsightsEmpty />
      ) : (
        <>
          {/* Net worth hero */}
          <View className="mb-2">
            <Eyebrow className="mb-2">{t('insights.netWorth')}</Eyebrow>
            <Text
              className="font-sans-semibold text-ink"
              style={{ fontSize: 44, letterSpacing: -1.3, fontVariant: ['tabular-nums'] }}
            >
              {money(report.current)}
            </Text>
            <View className="flex-row items-center gap-2 mt-2.5 mb-4">
              <View
                className={`flex-row items-center gap-1.5 px-2.5 py-[5px] rounded-full ${
                  monthDelta >= 0 ? 'bg-positive-soft' : 'bg-negative-soft'
                }`}
              >
                <View
                  className={`w-1.5 h-1.5 rounded-full ${
                    monthDelta >= 0 ? 'bg-positive-2' : 'bg-negative-2'
                  }`}
                />
                <Text
                  className={`font-sans-semibold text-xs ${
                    monthDelta >= 0 ? 'text-positive-2' : 'text-negative-2'
                  }`}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {monthDelta >= 0 ? '+' : '−'} {money(Math.abs(monthDelta), { cents: false })}{' '}
                  {t('insights.thisMonth')}
                </Text>
              </View>
            </View>
            <LineChart data={series} stroke="#1A7A50" areaFill="#E4F1E9" />
          </View>

          {/* Spending by category entry */}
          <ListBlock className="mt-4">
            <Row
              first
              tile={<Tile icon="pie-chart-outline" />}
              title={t('insights.spendingByCategory')}
              sub={t('insights.spendingSub')}
              trailing={<Ionicons name="chevron-forward" size={16} color="#8C897D" />}
              onPress={() => router.push('/reports/spending')}
            />
          </ListBlock>

          {/* Balances */}
          <ListBlock
            eyebrow={t('insights.balances')}
            trailing={
              <Text
                className="font-sans-semibold text-[13px] text-ink-3"
                onPress={() => router.push('/accounts')}
              >
                {t('insights.allAccounts')}
              </Text>
            }
            className="mt-4"
          >
            {assets.map((a, i) => (
              <Row
                key={a.id}
                first={i === 0}
                tile={<Tile icon="wallet-outline" size={36} />}
                title={a.name}
                trailing={
                  <Text
                    className="font-sans-semibold text-[15px] text-ink"
                    style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.15 }}
                  >
                    {money(num(a.currentBalance), { currency: a.currencyCode })}
                  </Text>
                }
                onPress={() => router.push(`/accounts/${a.id}`)}
              />
            ))}
          </ListBlock>
        </>
      )}
    </Page>
  );
}

// First-run empty state — muted $0 net worth, ghost 6-month chart, add-account row
function InsightsEmpty() {
  const { t } = useTranslation();
  const now = new Date();
  const monthLabels = Array.from(
    { length: 6 },
    (_, i) => MONTHS_SHORT[(now.getMonth() - 5 + i + 12) % 12],
  );

  return (
    <>
      {/* Net worth — zero, quietly */}
      <View className="mb-2">
        <Eyebrow className="mb-2">{t('insights.netWorth')}</Eyebrow>
        <Text
          className="font-sans-semibold text-ink-3"
          style={{ fontSize: 44, letterSpacing: -1.3, fontVariant: ['tabular-nums'] }}
        >
          {money(0)}
        </Text>
        <Text className="font-sans text-[13.5px] text-ink-3 mt-2.5 mb-4">
          {t('insights.emptyHero')}
        </Text>
      </View>

      {/* Ghost chart panel */}
      <View className="bg-paper-2 rounded-[24px] px-4 pt-[18px] pb-3.5 mb-5">
        <Eyebrow className="mb-2.5">{t('insights.netWorth6m')}</Eyebrow>
        <Text className="font-sans text-[13.5px] text-ink-3">{t('insights.noSpending')}</Text>
        <GhostChart labels={monthLabels} />
      </View>

      {/* Balances */}
      <ListBlock eyebrow={t('insights.balances')}>
        <Row
          first
          tile={<Tile icon="wallet-outline" dashed />}
          title={t('insights.addAccount')}
          sub={t('insights.balancesAppear')}
          trailing={<Ionicons name="chevron-forward" size={16} color="#8C897D" />}
          onPress={() => router.push('/accounts/create')}
        />
      </ListBlock>
    </>
  );
}
