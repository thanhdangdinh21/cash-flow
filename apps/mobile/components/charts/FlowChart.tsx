import { Text, View } from 'react-native';

// Diverging cash-flow chart (design Direction C): income bars rise above a
// hairline baseline in green, spending hangs below in clay. Pure flexbox.
const TOP = 78;
const BOTTOM = 64;

export function FlowChart({
  data,
}: {
  data: { label: string; income: number; spent: number }[];
}) {
  if (!data.length) return null;
  const maxUp = Math.max(...data.map((d) => d.income), 1);
  const maxDown = Math.max(...data.map((d) => d.spent), 1);
  return (
    <View className="flex-row gap-3">
      {data.map((d, i) => (
        <View key={i} className="flex-1 items-center">
          <View style={{ height: TOP }} className="w-full items-center justify-end">
            <View
              className="bg-positive rounded-t-[6px]"
              style={{ width: '58%', height: Math.max(0, (d.income / maxUp) * TOP) }}
            />
          </View>
          <View className="w-full bg-line-strong" style={{ height: 1.5 }} />
          <View style={{ height: BOTTOM }} className="w-full items-center justify-start">
            <View
              className="bg-negative rounded-b-[6px]"
              style={{ width: '58%', height: Math.max(0, (d.spent / maxDown) * BOTTOM) }}
            />
          </View>
          <Text className="font-mono text-[10.5px] text-ink-3 mt-2">{d.label}</Text>
        </View>
      ))}
    </View>
  );
}
