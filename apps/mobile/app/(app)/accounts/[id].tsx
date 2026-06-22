import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAccountDetail, useTransactions } from '@/lib/hooks';
import { money, num } from '@/lib/format';
import type { AccountDetailData } from '@/lib/types';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { ListBlock } from '@/components/ui/ListBlock';
import { Row } from '@/components/ui/Row';
import { Tile } from '@/components/ui/Tile';
import { Stat, StatDivider } from '@/components/ui/Stat';
import { TxnRow } from '@/components/TxnRow';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Commodity variant — qty hero, cost stats, purchase lots (design: Gold screen)
function CommodityDetail({ account }: { account: AccountDetailData }) {
  const { t } = useTranslation();
  const holding = account.holdings[0];
  const qty = num(holding.currentQuantity);
  const cost = num(holding.currentCost);
  const avg = qty > 0 ? cost / qty : 0;
  const currency = account.currencyCode;
  const purchases = account.lots.filter((l) => l.type === 'DEBIT' && l.quantity);

  return (
    <>
      <View className="flex-row items-baseline gap-2.5 mb-1">
        <Text
          className="font-sans-semibold text-ink"
          style={{ fontSize: 44, letterSpacing: -1.3, fontVariant: ['tabular-nums'] }}
        >
          {qty}
        </Text>
        <Text className="font-sans-semibold text-[17px] text-ink-3">{holding.unitName}</Text>
      </View>
      <Text className="font-sans text-sm text-ink-3 mb-5">{t('accounts.detail.totalQty')}</Text>

      <View className="bg-paper-2 rounded-xl px-4 py-4 flex-row gap-4 mb-6">
        <Stat label={t('accounts.detail.totalCost')} value={money(cost, { currency })} />
        <StatDivider />
        <Stat
          label={t('accounts.detail.avgUnitPrice')}
          value={`${money(avg, { currency })} / ${holding.unitName}`}
        />
      </View>

      <ListBlock eyebrow={t('accounts.detail.purchases')}>
        {purchases.length === 0 ? (
          <Text className="font-sans text-sm text-ink-4 py-4">{t('accounts.detail.noPurchases')}</Text>
        ) : (
          purchases.map((l, i) => {
            const d = new Date(l.transaction.date);
            const unit = num(l.quantity) > 0 ? num(l.amount) / num(l.quantity!) : 0;
            return (
              <Row
                key={l.id}
                first={i === 0}
                tile={<Tile icon="locate-outline" />}
                title={`+ ${num(l.quantity!)} ${holding.unitName}`}
                sub={`${MONTHS[d.getMonth()]} ${d.getDate()} · ${money(unit, { currency })} / ${holding.unitName}`}
                trailing={
                  <Text
                    className="font-sans-semibold text-[15px] text-ink"
                    style={{ fontVariant: ['tabular-nums'] }}
                  >
                    − {money(num(l.amount), { currency })}
                  </Text>
                }
              />
            );
          })
        )}
      </ListBlock>

      <View className="flex-row items-center gap-2.5 mt-4">
        <Ionicons name="sparkles-outline" size={14} color="#1A7A50" />
        <Text className="flex-1 font-sans text-[13px] text-ink-3">
          {t('accounts.detail.qtyRequired')}
        </Text>
      </View>
    </>
  );
}

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: account, isLoading } = useAccountDetail(id);
  const { data: txns } = useTransactions({ accountId: id });

  if (isLoading || !account) {
    return (
      <Page>
        <Head title="" />
        <View className="py-16 items-center">
          <ActivityIndicator color="#181712" />
        </View>
      </Page>
    );
  }

  const isCommodity = account.holdings.length > 0;
  const currency = account.currencyCode;
  const now = new Date();
  const monthName = MONTHS[now.getMonth()];

  return (
    <Page>
      <Head
        eyebrow={
          isCommodity
            ? `${t(`accounts.type.${account.type}`)} · ${t('accounts.commodity')}`
            : t(`accounts.type.${account.type}`)
        }
        title={account.name}
      />

      {isCommodity ? (
        <CommodityDetail account={account} />
      ) : (
        <>
          <Text
            className="font-sans-semibold text-ink mb-3"
            style={{ fontSize: 44, letterSpacing: -1.3, fontVariant: ['tabular-nums'] }}
          >
            {money(num(account.currentBalance), { currency })}
          </Text>
          <View className="flex-row gap-4 mb-6">
            <Stat
              label={`${t('accounts.detail.in')} · ${monthName}`}
              value={`+ ${money(account.monthIn, { cents: false, currency })}`}
              tone="pos"
            />
            <StatDivider />
            <Stat
              label={`${t('accounts.detail.out')} · ${monthName}`}
              value={`− ${money(account.monthOut, { cents: false, currency })}`}
              tone="neg"
            />
          </View>

          <ListBlock eyebrow={t('accounts.detail.history')}>
            {!txns || txns.items.length === 0 ? (
              <Text className="font-sans text-sm text-ink-4 py-4">
                {t('accounts.detail.noHistory')}
              </Text>
            ) : (
              txns.items
                .slice(0, 20)
                .map((txn, i) => <TxnRow key={txn.id} txn={txn} first={i === 0} />)
            )}
          </ListBlock>
        </>
      )}
    </Page>
  );
}
