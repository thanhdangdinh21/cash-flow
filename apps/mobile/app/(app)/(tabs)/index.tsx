import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useHomeReport, useMe } from '@/lib/hooks';
import type { HomeReportData } from '@/lib/types';
import { eyebrowDate, money, num } from '@/lib/format';
import { Page } from '@/components/ui/Page';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ListBlock } from '@/components/ui/ListBlock';
import { Row } from '@/components/ui/Row';
import { Tile } from '@/components/ui/Tile';
import { FlowChart } from '@/components/charts/FlowChart';
import { GhostChart } from '@/components/charts/GhostChart';
import { TxnRow } from '@/components/TxnRow';
import { BudgetRow, EmptyBudgetRow } from '@/components/BudgetRow';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Home — design Direction C "Editorial: big & quiet"
export default function HomeScreen() {
  const { t } = useTranslation();
  const { data: me } = useMe();
  const { data: report, isLoading } = useHomeReport();

  const firstName = me?.name?.split(' ')[0] ?? '';

  if (isLoading || !report) {
    return (
      <Page>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#181712" />
        </View>
      </Page>
    );
  }

  const hasFlow = report.weeks.some((w) => w.income > 0 || w.spent > 0);
  // First run — nothing added yet (seeded accounts arrive empty)
  const isFirstRun =
    report.totalAssets === 0 && report.recent.length === 0 && report.budgets.length === 0;

  return (
    <Page>
      {/* Editorial header */}
      <View className="flex-row items-start justify-between mb-6">
        <View>
          <Eyebrow className="mb-2">{eyebrowDate()}</Eyebrow>
          <Text className="font-sans-semibold text-ink" style={{ fontSize: 27, letterSpacing: -0.55 }}>
            {t('home.hello', { name: firstName })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
          className="w-11 h-11 rounded-md items-center justify-center"
        >
          <Ionicons name="person-circle-outline" size={26} color="#181712" />
        </TouchableOpacity>
      </View>

      {isFirstRun ? <HomeEmpty /> : <HomeBody report={report} hasFlow={hasFlow} />}
    </Page>
  );
}

// First-run empty state — muted $0 hero, first-steps list, ghost cash-flow panel
function HomeEmpty() {
  const { t } = useTranslation();
  const chevron = <Ionicons name="chevron-forward" size={16} color="#8C897D" />;

  return (
    <>
      {/* Hero — zero, quietly */}
      <View className="mb-6">
        <Eyebrow className="mb-3">{t('home.totalAssets')}</Eyebrow>
        <Text
          className="font-sans-semibold text-ink-3"
          style={{ fontSize: 52, letterSpacing: -1.8, lineHeight: 52, fontVariant: ['tabular-nums'] }}
        >
          {money(0)}
        </Text>
        <Text className="font-sans text-[13.5px] text-ink-3 mt-3.5">{t('home.emptyHero')}</Text>
      </View>

      {/* First steps */}
      <ListBlock eyebrow={t('home.firstSteps')} className="mb-6">
        <Row
          first
          tile={<Tile icon="wallet-outline" dashed />}
          title={t('home.addAccount')}
          sub={t('home.addAccountSub')}
          trailing={chevron}
          onPress={() => router.push('/accounts/create')}
        />
        <Row
          tile={<Tile icon="add" dashed />}
          title={t('home.recordTransaction')}
          sub={t('home.recordTransactionSub')}
          trailing={chevron}
          onPress={() => router.push('/add')}
        />
        <Row
          tile={<Tile icon="disc-outline" dashed />}
          title={t('home.createBudget')}
          sub={t('home.createBudgetSub')}
          trailing={chevron}
          onPress={() => router.push('/budgets')}
        />
      </ListBlock>

      {/* Cash flow — ghost panel */}
      <View className="bg-paper-2 rounded-xl px-[18px] pt-5 pb-[18px]">
        <Eyebrow className="mb-2.5">{t('home.cashFlow')}</Eyebrow>
        <Text className="font-sans text-[13.5px] text-ink-3">{t('home.emptyFlow')}</Text>
        <GhostChart labels={[1, 2, 3, 4].map((n) => t('home.weekShort', { n }))} />
      </View>
    </>
  );
}

function HomeBody({ report, hasFlow }: { report: HomeReportData; hasFlow: boolean }) {
  const { t } = useTranslation();
  const monthName = MONTHS[new Date().getMonth()];

  return (
    <>
      {/* Hero — total assets */}
      <View className="mb-3.5">
        <Eyebrow className="mb-3">{t('home.totalAssets')}</Eyebrow>
        <Text
          className="font-sans-semibold text-ink"
          style={{ fontSize: 52, letterSpacing: -1.8, lineHeight: 52, fontVariant: ['tabular-nums'] }}
        >
          {money(report.totalAssets)}
        </Text>
        <View className="flex-row items-center gap-2.5 mt-4">
          <View
            className={`flex-row items-center gap-1.5 px-2.5 py-[5px] rounded-full ${
              report.net >= 0 ? 'bg-positive-soft' : 'bg-negative-soft'
            }`}
          >
            <View
              className={`w-1.5 h-1.5 rounded-full ${report.net >= 0 ? 'bg-positive-2' : 'bg-negative-2'}`}
            />
            <Text
              className={`font-sans-semibold text-xs ${
                report.net >= 0 ? 'text-positive-2' : 'text-negative-2'
              }`}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {t('home.net')} {report.net >= 0 ? '+' : '−'} {money(Math.abs(report.net), { cents: false })}
            </Text>
          </View>
          <Text className="font-sans text-[13px] text-ink-3">
            {report.net >= 0 ? t('home.upThisMonth') : t('home.downThisMonth')}
          </Text>
        </View>
      </View>

      {/* Wallets — where it sits */}
      <ListBlock eyebrow={t('home.whereItSits')} className="mt-6 mb-6">
        {report.wallets.map((w, i) => (
          <Row
            key={w.id}
            first={i === 0}
            tile={<Tile icon="wallet-outline" />}
            title={w.name}
            sub={w.currencyCode}
            trailing={
              <Text
                className="font-sans-semibold text-base text-ink"
                style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.16 }}
              >
                {money(num(w.currentBalance), { currency: w.currencyCode })}
              </Text>
            }
            onPress={() => router.push(`/accounts/${w.id}`)}
          />
        ))}
      </ListBlock>

      {/* Cash flow — diverging viz on a sunken panel */}
      <View className="bg-paper-2 rounded-xl px-4 pt-5 pb-4 mb-7">
        <Eyebrow className="mb-3.5">{`${t('home.cashFlow')} · ${monthName}`}</Eyebrow>
        <View className="flex-row gap-4 mb-4">
          <View>
            <Text className="font-sans text-[12.5px] text-ink-3 mb-0.5">{t('home.in')}</Text>
            <Text
              className="font-sans-semibold text-2xl text-positive"
              style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}
            >
              + {money(report.monthIncome, { cents: false })}
            </Text>
          </View>
          <View className="w-px bg-line-2" />
          <View>
            <Text className="font-sans text-[12.5px] text-ink-3 mb-0.5">{t('home.out')}</Text>
            <Text
              className="font-sans-semibold text-2xl text-negative"
              style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.5 }}
            >
              − {money(report.monthSpent, { cents: false })}
            </Text>
          </View>
        </View>
        {hasFlow ? (
          <FlowChart data={report.weeks} />
        ) : (
          <Text className="font-sans text-sm text-ink-4 py-3">{t('home.noFlow')}</Text>
        )}
      </View>

      {/* Budgets */}
      <ListBlock
        eyebrow={t('nav.budgets')}
        trailing={
          <TouchableOpacity onPress={() => router.push('/budgets')} hitSlop={8}>
            <Text className="font-sans-semibold text-[13px] text-ink-3">{t('home.all')}</Text>
          </TouchableOpacity>
        }
        className="mb-6"
      >
        {report.budgets.length === 0 && !report.budgetSuggestion ? (
          <Text className="font-sans text-sm text-ink-4 py-4">{t('budgets.empty')}</Text>
        ) : (
          <>
            {report.budgets.map((b, i) => (
              <BudgetRow key={b.id} budget={b} first={i === 0} onPress={() => router.push('/budgets')} />
            ))}
            {report.budgetSuggestion?.category ? (
              <EmptyBudgetRow
                name={report.budgetSuggestion.category.name}
                spent={report.budgetSuggestion.spent}
                onPress={() => router.push('/budgets')}
              />
            ) : null}
          </>
        )}
      </ListBlock>

      {/* Recent */}
      <ListBlock
        eyebrow={t('home.recent')}
        trailing={
          <TouchableOpacity onPress={() => router.push('/activity')} hitSlop={8}>
            <Text className="font-sans-semibold text-[13px] text-ink-3">{t('home.seeAll')}</Text>
          </TouchableOpacity>
        }
      >
        {report.recent.length === 0 ? (
          <Text className="font-sans text-sm text-ink-4 py-4">{t('activity.empty')}</Text>
        ) : (
          report.recent.map((txn, i) => <TxnRow key={txn.id} txn={txn} first={i === 0} />)
        )}
      </ListBlock>
    </>
  );
}
