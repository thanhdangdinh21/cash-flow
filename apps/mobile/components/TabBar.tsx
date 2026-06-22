import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Minimal shape of @react-navigation/bottom-tabs' BottomTabBarProps — typed
// locally so we don't pin a second copy of react-navigation next to the one
// expo-router bundles (mismatched copies crash at runtime).
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  activity: 'receipt-outline',
  insights: 'trending-up',
};

// Design tab bar: Home · Activity · [+] · Insights.
// The center plus is not a tab — it pushes the add-transaction modal.
export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  const items = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const focused = state.index === index;
    return (
      <TouchableOpacity
        key={route.key}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }}
        activeOpacity={0.7}
        className="items-center gap-[3px] w-14"
      >
        <Ionicons
          name={ICONS[route.name] ?? 'ellipse-outline'}
          size={22}
          color={focused ? '#181712' : '#8C897D'}
        />
        <Text
          className={`text-[10.5px] ${
            focused ? 'font-sans-semibold text-ink' : 'font-sans-medium text-ink-3'
          }`}
        >
          {options.title}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <View
      className="flex-row items-center justify-around border-t border-line bg-paper/95 px-4 pt-2.5"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      {items.slice(0, 2)}
      <TouchableOpacity
        onPress={() => router.push('/add')}
        activeOpacity={0.85}
        className="w-[50px] h-[50px] rounded-[16px] bg-ink items-center justify-center shadow-md"
      >
        <Ionicons name="add" size={26} color="#FAF9F6" />
      </TouchableOpacity>
      {items.slice(2)}
    </View>
  );
}
