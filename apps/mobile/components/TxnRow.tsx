import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { money, num } from '@/lib/format';
import { txnAccountLabel, txnIcon, txnSign, txnTitle } from '@/lib/txn';
import type { TransactionData } from '@/lib/types';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Row } from '@/components/ui/Row';

// Transaction list row: category glyph · title/meta · signed amount.
// Money-in renders green with "+", money-out plain ink with "−",
// transfers muted with a swap glyph.
export function TxnRow({
  txn,
  first = false,
  sub,
}: {
  txn: TransactionData;
  first?: boolean;
  sub?: string;
}) {
  const sign = txnSign(txn);
  const amount = num(txn.amount);

  const subParts: string[] = [];
  if (txn.subCategory) {
    subParts.push(`${txn.subCategory.category.name} · ${txn.subCategory.name}`);
  }
  subParts.push(txnAccountLabel(txn));

  return (
    <Row
      first={first}
      tile={<CategoryIcon icon={txnIcon(txn)} />}
      title={txnTitle(txn)}
      sub={
        <View className="flex-row items-center gap-1 mt-px">
          {txn.transactionType === 'TRANSFER' ? (
            <Ionicons name="swap-horizontal" size={11} color="#8C897D" />
          ) : null}
          {txn.transactionType === 'LOAN' ? (
            <Ionicons name="people-outline" size={11} color="#8C897D" />
          ) : null}
          <Text numberOfLines={1} className="font-sans text-[12.5px] text-ink-3">
            {sub ?? subParts.join(' · ')}
          </Text>
        </View>
      }
      trailing={
        <Text
          className={`font-sans-semibold text-[15px] ${
            sign > 0 ? 'text-positive' : sign === 0 ? 'text-ink-3' : 'text-ink'
          }`}
          style={{ fontVariant: ['tabular-nums'], letterSpacing: -0.15 }}
        >
          {sign === 0 ? money(amount) : money(sign * amount, { sign: true })}
        </Text>
      }
      onPress={() => router.push(`/transactions/${txn.id}`)}
    />
  );
}
