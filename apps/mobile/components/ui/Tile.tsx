import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Icon tile: sunken square, optionally tinted (14% of the tint over surface)
// or dashed (empty-state / add affordances)
export function Tile({
  icon,
  size = 40,
  tint,
  dashed = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  tint?: string;
  dashed?: boolean;
}) {
  const radius = Math.round(size * 0.28);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: dashed ? 'transparent' : tint ? `${tint}24` : '#F2F0EA',
        borderWidth: dashed ? 1.5 : 0,
        borderColor: dashed ? '#C4BFB1' : undefined,
        borderStyle: dashed ? 'dashed' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Ionicons
        name={icon}
        size={Math.round(size * 0.5)}
        color={dashed ? '#8C897D' : tint ?? '#181712'}
      />
    </View>
  );
}
