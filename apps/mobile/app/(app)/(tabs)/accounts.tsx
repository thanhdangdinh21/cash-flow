import { useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { CURRENCIES } from '@repo/shared/currencies';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HoldingData {
  id: string;
  name: string;
  unitName: string;
  currentQuantity: string;
  currentCost: string;
}

interface AccountData {
  id: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
  currencyCode: string;
  initialBalance: string;
  currentBalance: string;
  holdings: HoldingData[];
}

interface HoldingForm {
  name: string;
  unitName: string;
}

interface AccountForm {
  name: string;
  type: AccountData['type'];
  currencyCode: string;
  initialBalance: string;
  holdings: HoldingForm[];
}

const ACCOUNT_TYPES: AccountData['type'][] = [
  'ASSET',
  'LIABILITY',
  'INCOME',
  'EXPENSE',
  'EQUITY',
];

const INITIAL_FORM: AccountForm = {
  name: '',
  type: 'ASSET',
  currencyCode: 'USD',
  initialBalance: '0',
  holdings: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByType(accounts: AccountData[]) {
  const map: Record<string, AccountData[]> = {};
  for (const acc of accounts) {
    if (!map[acc.type]) map[acc.type] = [];
    map[acc.type].push(acc);
  }
  return ACCOUNT_TYPES.filter((t) => map[t]?.length).map((t) => ({
    title: t,
    data: map[t],
  }));
}

function formatBalance(balance: string, currencyCode: string): string {
  const num = parseFloat(balance ?? '0');
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyCode}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HoldingRow({ holding }: { holding: HoldingData }) {
  return (
    <View className="ml-4 py-2 px-3 border-l border-line mt-1">
      <Text className="font-sans-medium text-sm text-ink-2">{holding.name}</Text>
      <Text
        className="font-sans text-xs text-ink-3"
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {holding.currentQuantity} {holding.unitName}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AccountsScreen() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<AccountForm>(INITIAL_FORM);

  // Fetch accounts
  const { data: accounts = [], isLoading } = useQuery<AccountData[]>({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then((r) => r.data),
  });

  // Create account
  const createMutation = useMutation({
    mutationFn: (data: AccountForm) => api.post('/accounts', data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setModalVisible(false);
      setForm(INITIAL_FORM);
    },
    onError: (err: any) => {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('accounts.failedCreate'));
    },
  });

  // Delete account
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: any) => {
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('accounts.failedDelete'));
    },
  });

  function handleLongPress(account: AccountData) {
    Alert.alert(
      t('accounts.deleteTitle'),
      t('accounts.deleteMessage', { name: account.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('accounts.form.remove'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(account.id),
        },
      ]
    );
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert(t('common.error'), t('accounts.nameRequired'));
      return;
    }
    createMutation.mutate(form);
  }

  function addHoldingRow() {
    setForm((f) => ({
      ...f,
      holdings: [...f.holdings, { name: '', unitName: '' }],
    }));
  }

  function updateHolding(idx: number, field: keyof HoldingForm, value: string) {
    setForm((f) => {
      const holdings = [...f.holdings];
      holdings[idx] = { ...holdings[idx], [field]: value };
      return { ...f, holdings };
    });
  }

  function removeHolding(idx: number) {
    setForm((f) => ({
      ...f,
      holdings: f.holdings.filter((_, i) => i !== idx),
    }));
  }

  const sections = groupByType(accounts);

  return (
    <View className="flex-1 bg-paper">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4 bg-paper border-b border-line">
        <Text className="font-sans-semibold text-2xl text-ink tracking-tight">
          {t('accounts.title')}
        </Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
          className="w-11 h-11 bg-ink rounded-md items-center justify-center"
        >
          <Text className="text-paper text-2xl font-light leading-none">+</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#181712" />
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="font-sans text-ink-4 text-base">{t('accounts.noAccountsHint')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderSectionHeader={({ section }) => (
            <View className="px-5 py-2 bg-paper-2">
              <Text className="font-mono-semibold text-2xs uppercase tracking-[1.5px] text-ink-3">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() => handleLongPress(item)}
              activeOpacity={0.7}
              className="bg-surface px-5 py-3.5 border-b border-line"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-sans-semibold text-ink text-base">{item.name}</Text>
                <Text
                  className={`font-sans-semibold text-sm ${
                    parseFloat(item.currentBalance) < 0 ? 'text-negative' : 'text-ink'
                  }`}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {formatBalance(item.currentBalance, item.currencyCode)}
                </Text>
              </View>
              {item.type === 'ASSET' && item.holdings?.length > 0 && (
                <View className="mt-1">
                  {item.holdings.map((h) => (
                    <HoldingRow key={h.id} holding={h} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Create Account Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-paper">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-5 pt-12 pb-4 bg-surface border-b border-line">
            <TouchableOpacity onPress={() => { setModalVisible(false); setForm(INITIAL_FORM); }}>
              <Text className="font-sans text-ink-3 text-base">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text className="font-sans-semibold text-base text-ink">{t('accounts.form.newTitle')}</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="#181712" />
              ) : (
                <Text className="font-sans-semibold text-ink text-base">{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            <View className="mx-5 mt-6 bg-surface rounded-lg border border-line overflow-hidden">
              {/* Name */}
              <View className="px-4 py-3 border-b border-line">
                <Text className="font-mono-semibold text-2xs uppercase tracking-[1.5px] text-ink-3 mb-1">{t('accounts.form.name')}</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder={t('accounts.form.namePlaceholder')}
                  placeholderTextColor="#B6B2A6"
                  className="font-sans text-ink text-base"
                />
              </View>

              {/* Type */}
              <View className="px-4 py-3 border-b border-line">
                <Text className="font-mono-semibold text-2xs uppercase tracking-[1.5px] text-ink-3 mb-2">{t('accounts.form.type')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {ACCOUNT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setForm((f) => ({ ...f, type, holdings: [] }))}
                        className={`px-3 py-1.5 rounded-full border ${
                          form.type === type
                            ? 'bg-ink border-ink'
                            : 'bg-surface border-line-2'
                        }`}
                      >
                        <Text
                          className={`font-sans-medium text-sm ${
                            form.type === type ? 'text-paper' : 'text-ink-2'
                          }`}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Currency */}
              <View className="px-4 py-3 border-b border-line">
                <Text className="font-mono-semibold text-2xs uppercase tracking-[1.5px] text-ink-3 mb-2">{t('accounts.form.currency')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {CURRENCIES.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        onPress={() => setForm((f) => ({ ...f, currencyCode: c.code }))}
                        className={`px-3 py-1.5 rounded-full border ${
                          form.currencyCode === c.code
                            ? 'bg-ink border-ink'
                            : 'bg-surface border-line-2'
                        }`}
                      >
                        <Text
                          className={`font-sans-medium text-sm ${
                            form.currencyCode === c.code ? 'text-paper' : 'text-ink-2'
                          }`}
                        >
                          {c.code}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Initial Balance */}
              <View className="px-4 py-3">
                <Text className="font-mono-semibold text-2xs uppercase tracking-[1.5px] text-ink-3 mb-1">{t('accounts.form.initialBalance')}</Text>
                <TextInput
                  value={form.initialBalance}
                  onChangeText={(v) => setForm((f) => ({ ...f, initialBalance: v }))}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#B6B2A6"
                  className="font-sans text-ink text-base"
                />
              </View>
            </View>

            {/* Holdings section — only for ASSET */}
            {form.type === 'ASSET' && (
              <View className="mx-5 mt-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-sans-semibold text-sm text-ink-2">{t('accounts.form.holdings')}</Text>
                  <TouchableOpacity onPress={addHoldingRow}>
                    <Text className="font-sans-semibold text-sm text-ink">+ {t('accounts.form.addHolding')}</Text>
                  </TouchableOpacity>
                </View>

                {form.holdings.length === 0 && (
                  <Text className="font-sans text-sm text-ink-4 mb-2">
                    {t('accounts.form.noHoldings')}
                  </Text>
                )}

                {form.holdings.map((h, idx) => (
                  <View
                    key={idx}
                    className="bg-surface rounded-lg border border-line overflow-hidden mb-3"
                  >
                    <View className="px-4 py-3 border-b border-line">
                      <Text className="font-mono-semibold text-2xs uppercase tracking-[1.5px] text-ink-3 mb-1">{t('accounts.form.name')}</Text>
                      <TextInput
                        value={h.name}
                        onChangeText={(v) => updateHolding(idx, 'name', v)}
                        placeholder="e.g. Apple Stock"
                        placeholderTextColor="#B6B2A6"
                        className="font-sans text-ink text-base"
                      />
                    </View>
                    <View className="px-4 py-3 border-b border-line">
                      <Text className="font-mono-semibold text-2xs uppercase tracking-[1.5px] text-ink-3 mb-1">{t('accounts.form.unit')}</Text>
                      <TextInput
                        value={h.unitName}
                        onChangeText={(v) => updateHolding(idx, 'unitName', v)}
                        placeholder="e.g. shares"
                        placeholderTextColor="#B6B2A6"
                        className="font-sans text-ink text-base"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => removeHolding(idx)}
                      className="px-4 py-3 items-center"
                    >
                      <Text className="font-sans-medium text-negative text-sm">{t('accounts.form.remove')}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View className="h-8" />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
