import { Text, View } from 'react-native';

// Label + mono amount pair (account in/out, report stats)
export function Stat({
  label,
  value,
  tone,
  big = false,
}: {
  label: string;
  value: string;
  tone?: 'pos' | 'neg';
  big?: boolean;
}) {
  const color =
    tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : 'text-ink';
  return (
    <View className="flex-1">
      <Text className="font-sans text-[12.5px] text-ink-3 mb-0.5">{label}</Text>
      <Text
        className={`font-sans-semibold ${big ? 'text-2xl' : 'text-md'} ${color}`}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Text>
    </View>
  );
}

// Thin vertical divider between paired stats
export function StatDivider() {
  return <View className="w-px bg-line-2" />;
}
