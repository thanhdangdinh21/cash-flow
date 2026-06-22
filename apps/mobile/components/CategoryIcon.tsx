import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Design icon keys (stored on Category.icon) → Ionicons glyph + tint.
// Tints come straight from the design's category palette.
const ICON_MAP: Record<string, { ion: keyof typeof Ionicons.glyphMap; tint: string }> = {
  cart: { ion: 'cart-outline', tint: '#1A7A50' },
  coffee: { ion: 'cafe-outline', tint: '#BE4A30' },
  home2: { ion: 'home-outline', tint: '#2C5E8A' },
  car: { ion: 'car-outline', tint: '#B07A1E' },
  film: { ion: 'film-outline', tint: '#7A4FB0' },
  zap: { ion: 'flash-outline', tint: '#3A7A6E' },
  trendUp: { ion: 'trending-up', tint: '#1A7A50' },
  receipt: { ion: 'receipt-outline', tint: '#59574E' },
  wallet: { ion: 'wallet-outline', tint: '#59574E' },
  users: { ion: 'people-outline', tint: '#2C5E8A' },
  pie: { ion: 'pie-chart-outline', tint: '#7A4FB0' },
  gift: { ion: 'gift-outline', tint: '#BE4A30' },
  heart: { ion: 'heart-outline', tint: '#BE4A30' },
  book: { ion: 'book-outline', tint: '#2C5E8A' },
};

export function categoryMeta(icon?: string | null) {
  return ICON_MAP[icon ?? ''] ?? { ion: 'pricetag-outline' as const, tint: '#59574E' };
}

// Tinted rounded-square category glyph (14% tint over surface)
export function CategoryIcon({ icon, size = 42 }: { icon?: string | null; size?: number }) {
  const meta = categoryMeta(icon);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.31),
        backgroundColor: `${meta.tint}24`,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Ionicons name={meta.ion} size={Math.round(size * 0.48)} color={meta.tint} />
    </View>
  );
}

// Selectable icon keys for the category editor
export const CATEGORY_ICON_KEYS = Object.keys(ICON_MAP);
