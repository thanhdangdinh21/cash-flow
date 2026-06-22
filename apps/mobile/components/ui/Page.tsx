import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Editorial screen shell: paper background, 20px gutters, safe-area clearance.
// scroll=false renders a plain flex column (for screens managing their own list).
export function Page({
  children,
  scroll = true,
  padTop = true,
  bottom = 28,
}: {
  children: ReactNode;
  scroll?: boolean;
  padTop?: boolean;
  bottom?: number;
}) {
  const insets = useSafeAreaInsets();
  const paddingTop = padTop ? insets.top + 12 : 0;

  if (!scroll) {
    return (
      <View className="flex-1 bg-paper px-5" style={{ paddingTop }}>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentContainerStyle={{
        paddingTop,
        paddingHorizontal: 20,
        paddingBottom: bottom + insets.bottom,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
