import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { TabBar } from '@/components/TabBar';

// Design tab bar: Home · Activity · [+] · Insights.
// The center add button lives in the custom TabBar, not a tab route.
export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('nav.home') }} />
      <Tabs.Screen name="activity" options={{ title: t('nav.activity') }} />
      <Tabs.Screen name="insights" options={{ title: t('nav.insights') }} />
    </Tabs>
  );
}
