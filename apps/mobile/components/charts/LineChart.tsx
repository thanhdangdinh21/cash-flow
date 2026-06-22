import { Text, View } from 'react-native';
import Svg, { Circle, Polygon, Polyline } from 'react-native-svg';

// Single-series line chart with optional area fill and end dot — port of the
// design's reports Line component.
export function LineChart({
  data,
  height = 120,
  stroke = '#181712',
  areaFill,
}: {
  data: { label: string; value: number }[];
  height?: number;
  stroke?: string;
  areaFill?: string;
}) {
  if (data.length < 2) return null;
  const w = 322;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const px = (i: number) => (i / (data.length - 1)) * (w - 8) + 4;
  const py = (v: number) => height - 14 - ((v - min) / (max - min || 1)) * (height - 28);
  const points = data.map((d, i) => `${px(i)},${py(d.value)}`).join(' ');

  return (
    <View>
      <Svg width="100%" viewBox={`0 0 ${w} ${height}`}>
        {areaFill ? (
          <Polygon
            points={`4,${height - 14} ${points} ${w - 4},${height - 14}`}
            fill={areaFill}
          />
        ) : null}
        <Polyline
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle
          cx={px(data.length - 1)}
          cy={py(data[data.length - 1].value)}
          r={4}
          fill={stroke}
        />
      </Svg>
      <View className="flex-row justify-between px-0.5">
        {data.map((d, i) => (
          <Text key={`${d.label}-${i}`} className="font-mono text-[10.5px] text-ink-3">
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
