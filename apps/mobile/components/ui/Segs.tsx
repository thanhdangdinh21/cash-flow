import { Text, TouchableOpacity, View } from 'react-native';

// Segmented pill chips — selected chip flips to ink/paper
export function Segs<T extends string>({
  options,
  value,
  onChange,
  labels,
  wrap = false,
}: {
  options: readonly T[];
  value: T;
  onChange?: (v: T) => void;
  labels?: Partial<Record<T, string>>;
  wrap?: boolean;
}) {
  return (
    <View className={`flex-row gap-2 ${wrap ? 'flex-wrap' : ''}`}>
      {options.map((o) => {
        const on = o === value;
        return (
          <TouchableOpacity
            key={o}
            onPress={onChange ? () => onChange(o) : undefined}
            activeOpacity={0.7}
            className={`px-3.5 py-2 rounded-full border ${
              on ? 'bg-ink border-ink' : 'bg-transparent border-line-2'
            }`}
          >
            <Text
              className={`font-sans-semibold text-[13.5px] ${on ? 'text-paper' : 'text-ink-2'}`}
            >
              {labels?.[o] ?? o}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
