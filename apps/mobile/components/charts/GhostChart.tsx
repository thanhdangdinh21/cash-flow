import { Text, View } from 'react-native';

// Ghost of a chart to come: flat dashed baseline + mono axis labels
// (empty states — design GhostChart)
export function GhostChart({ labels }: { labels: string[] }) {
  return (
    <View>
      {/* iOS can't dash a single border side, so clip a fully dashed box to its top edge */}
      <View className="mx-0.5 mb-2 mt-[26px]" style={{ height: 2, overflow: 'hidden' }}>
        <View
          style={{
            height: 8,
            borderWidth: 2,
            borderColor: '#C4BFB1',
            borderStyle: 'dashed',
            borderRadius: 1,
          }}
        />
      </View>
      <View className="flex-row justify-between px-0.5">
        {labels.map((label) => (
          <Text key={label} className="font-mono text-ink-3" style={{ fontSize: 10.5 }}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}
