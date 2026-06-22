import { Alert, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api, TOKEN } from '@/lib/api';
import { useMe } from '@/lib/hooks';
import { Page } from '@/components/ui/Page';
import { Head } from '@/components/ui/Head';
import { ListBlock } from '@/components/ui/ListBlock';
import { Row } from '@/components/ui/Row';
import { Tile } from '@/components/ui/Tile';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Sheet } from '@/components/ui/Sheet';
import { useState } from 'react';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const [languageSheet, setLanguageSheet] = useState(false);

  const notificationsMutation = useMutation({
    mutationFn: (notificationsOn: boolean) => api.patch('/users/me', { notificationsOn }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  function handleLogout() {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          await TOKEN.clear();
          queryClient.clear();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const chev = <Ionicons name="chevron-forward" size={16} color="#8C897D" />;

  return (
    <Page>
      <Head eyebrow={t('profile.eyebrow')} title={t('profile.title')} />

      {/* Identity */}
      <View className="flex-row items-center gap-3.5 mb-6">
        <View className="w-14 h-14 rounded-full bg-paper-2 border border-line items-center justify-center">
          <Text className="font-sans-semibold text-md text-ink-2">
            {me ? initials(me.name) : '··'}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-md text-ink">{me?.name ?? ''}</Text>
          <Text className="font-sans text-[13.5px] text-ink-3 mt-0.5">{me?.email ?? ''}</Text>
        </View>
      </View>

      <ListBlock eyebrow={t('profile.preferences')}>
        <Row
          first
          tile={<Tile icon="globe-outline" />}
          title={t('settings.language')}
          trailing={
            <View className="flex-row items-center gap-2">
              <Text className="font-sans text-sm text-ink-3">
                {i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}
              </Text>
              {chev}
            </View>
          }
          onPress={() => setLanguageSheet(true)}
        />
        <Row
          tile={<Tile icon="moon-outline" />}
          title={t('profile.theme')}
          trailing={<Text className="font-sans text-sm text-ink-3">{t('profile.themeLight')}</Text>}
        />
        <Row
          tile={<Tile icon="notifications-outline" />}
          title={t('profile.notifications')}
          trailing={
            <Switch
              value={me?.notificationsOn ?? true}
              onValueChange={(v) => notificationsMutation.mutate(v)}
              trackColor={{ true: '#1A7A50', false: '#D8D4C8' }}
            />
          }
        />
      </ListBlock>

      <ListBlock eyebrow={t('profile.money')} className="mt-5">
        <Row
          first
          tile={<Tile icon="wallet-outline" />}
          title={t('accounts.title')}
          trailing={chev}
          onPress={() => router.push('/accounts')}
        />
        <Row
          tile={<Tile icon="pie-chart-outline" />}
          title={t('categories.title')}
          trailing={chev}
          onPress={() => router.push('/categories')}
        />
      </ListBlock>

      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.7}
        className="mt-auto flex-row items-center gap-2.5 pt-6"
      >
        <Ionicons name="log-out-outline" size={18} color="#BE4A30" />
        <Text className="font-sans-semibold text-[15px] text-negative">{t('profile.logout')}</Text>
      </TouchableOpacity>

      <Sheet
        visible={languageSheet}
        onClose={() => setLanguageSheet(false)}
        title={t('settings.language')}
      >
        <LanguageSwitcher />
        <View className="h-2" />
      </Sheet>
    </Page>
  );
}
