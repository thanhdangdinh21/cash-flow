import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { money, num } from '@/lib/format';
import type { BudgetData } from '@/lib/types';
import { CategoryIcon } from '@/components/CategoryIcon';

function StatusBadge({ spent, limit }: { spent: number; limit: number }) {
  const { t } = useTranslation();
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const over = spent > limit;
  const near = !over && pct >= 85;
  const cls = over
    ? 'bg-negative-soft text-negative-2'
    : near
      ? 'bg-warning-soft text-warning'
      : 'bg-positive-soft text-positive-2';
  const label = over
    ? t('budgets.overBy', { amount: money(spent - limit, { cents: false }) })
    : near
      ? t('budgets.almostThere')
      : t('budgets.onTrack');
  return (
    <View className={`px-2.5 py-[5px] rounded-full ${cls.split(' ')[0]}`}>
      <Text className={`font-sans-semibold text-xs ${cls.split(' ')[1]}`}>{label}</Text>
    </View>
  );
}

// Budget progress row (design BudgetRow): icon · name · status badge,
// progress bar, "spent of limit" + percentage
export function BudgetRow({
  budget,
  first = false,
  onPress,
  onLongPress,
}: {
  budget: BudgetData;
  first?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const { t } = useTranslation();
  const spent = budget.spent;
  const limit = num(budget.monthlyLimit);
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const over = spent > limit;
  const near = !over && pct >= 85;
  const barColor = over ? '#BE4A30' : near ? '#B07A1E' : '#1A7A50';

  const Wrapper = onPress || onLongPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      className={`py-3.5 ${first ? '' : 'border-t border-line'}`}
    >
      <View className="flex-row items-center gap-2.5 mb-2.5">
        <CategoryIcon icon={budget.category.icon} size={32} />
        <Text className="flex-1 font-sans-semibold text-[14.5px] text-ink">
          {budget.category.name}
        </Text>
        <StatusBadge spent={spent} limit={limit} />
      </View>
      <View className="h-2 rounded-full bg-paper-2 overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
        />
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="font-sans-medium text-[12.5px] text-ink-2" style={{ fontVariant: ['tabular-nums'] }}>
          {t('budgets.spentOf', {
            spent: money(spent, { cents: false }),
            limit: money(limit, { cents: false }),
          })}
        </Text>
        <Text
          className={`font-sans text-[12.5px] ${over ? 'text-negative' : 'text-ink-3'}`}
          style={{ fontVariant: ['tabular-nums'] }}
        >
          {pct}%
        </Text>
      </View>
    </Wrapper>
  );
}

// Empty-state prompt: top unbudgeted spend category (design EmptyBudget)
export function EmptyBudgetRow({
  name,
  spent,
  onPress,
}: {
  name: string;
  spent: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="py-3.5 border-t border-line flex-row items-center gap-2.5">
      <View
        className="w-8 h-8 rounded-sm items-center justify-center"
        style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#C4BFB1' }}
      >
        <Ionicons name="add" size={16} color="#8C897D" />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="font-sans-semibold text-[14.5px] text-ink">
          {t('budgets.setBudgetFor', { name: name.toLowerCase() })}
        </Text>
        <Text className="font-sans text-[12.5px] text-ink-3 mt-px">
          {t('budgets.spentNoLimit', { amount: money(spent, { cents: false }) })}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="h-9 px-3.5 rounded-md border border-line-2 items-center justify-center"
      >
        <Text className="font-sans-semibold text-sm text-ink">{t('budgets.setUp')}</Text>
      </TouchableOpacity>
    </View>
  );
}
