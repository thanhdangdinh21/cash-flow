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
    <View className="ml-4 py-2 px-3 border-l border-slate-200 mt-1">
      <Text className="text-sm text-slate-700">{holding.name}</Text>
      <Text className="text-xs text-slate-400">
        {holding.currentQuantity} {holding.unitName}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AccountsScreen() {
  const queryClient = useQueryClient();
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
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to create account');
    },
  });

  // Delete account
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message ?? 'Failed to delete account');
    },
  });

  function handleLongPress(account: AccountData) {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(account.id),
        },
      ]
    );
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Account name is required');
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
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-14 pb-4 bg-white border-b border-slate-200">
        <Text className="text-xl font-bold text-slate-900">Accounts</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="w-9 h-9 bg-slate-900 rounded-full items-center justify-center"
        >
          <Text className="text-white text-xl font-light leading-none">+</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0f172a" />
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-400 text-base">No accounts yet. Tap + to add one.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderSectionHeader={({ section }) => (
            <View className="px-4 py-2 bg-slate-100">
              <Text className="text-xs font-semibold text-slate-500 tracking-wider">
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              onLongPress={() => handleLongPress(item)}
              activeOpacity={0.7}
              className="bg-white px-4 py-3 border-b border-slate-100"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-slate-900 text-base">{item.name}</Text>
                <Text className="text-sm text-slate-500">
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
        <View className="flex-1 bg-slate-50">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-4 pt-12 pb-4 bg-white border-b border-slate-200">
            <TouchableOpacity onPress={() => { setModalVisible(false); setForm(INITIAL_FORM); }}>
              <Text className="text-slate-500 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-base font-semibold text-slate-900">New Account</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <Text className="text-slate-900 font-semibold text-base">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            <View className="mx-4 mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Name */}
              <View className="px-4 py-3 border-b border-slate-100">
                <Text className="text-xs font-medium text-slate-500 mb-1">NAME</Text>
                <TextInput
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  placeholder="e.g. Checking Account"
                  placeholderTextColor="#94a3b8"
                  className="text-slate-900 text-base"
                />
              </View>

              {/* Type */}
              <View className="px-4 py-3 border-b border-slate-100">
                <Text className="text-xs font-medium text-slate-500 mb-2">TYPE</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {ACCOUNT_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setForm((f) => ({ ...f, type: t, holdings: [] }))}
                        className={`px-3 py-1.5 rounded-full border ${
                          form.type === t
                            ? 'bg-slate-900 border-slate-900'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            form.type === t ? 'text-white' : 'text-slate-600'
                          }`}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Currency */}
              <View className="px-4 py-3 border-b border-slate-100">
                <Text className="text-xs font-medium text-slate-500 mb-2">CURRENCY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {CURRENCIES.map((c) => (
                      <TouchableOpacity
                        key={c.code}
                        onPress={() => setForm((f) => ({ ...f, currencyCode: c.code }))}
                        className={`px-3 py-1.5 rounded-full border ${
                          form.currencyCode === c.code
                            ? 'bg-slate-900 border-slate-900'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            form.currencyCode === c.code ? 'text-white' : 'text-slate-600'
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
                <Text className="text-xs font-medium text-slate-500 mb-1">INITIAL BALANCE</Text>
                <TextInput
                  value={form.initialBalance}
                  onChangeText={(v) => setForm((f) => ({ ...f, initialBalance: v }))}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  className="text-slate-900 text-base"
                />
              </View>
            </View>

            {/* Holdings section — only for ASSET */}
            {form.type === 'ASSET' && (
              <View className="mx-4 mt-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-slate-700">Holdings</Text>
                  <TouchableOpacity onPress={addHoldingRow}>
                    <Text className="text-sm text-slate-900 font-medium">+ Add</Text>
                  </TouchableOpacity>
                </View>

                {form.holdings.length === 0 && (
                  <Text className="text-sm text-slate-400 mb-2">
                    No holdings. Tap "+ Add" to add one.
                  </Text>
                )}

                {form.holdings.map((h, idx) => (
                  <View
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-3"
                  >
                    <View className="px-4 py-3 border-b border-slate-100">
                      <Text className="text-xs font-medium text-slate-500 mb-1">NAME</Text>
                      <TextInput
                        value={h.name}
                        onChangeText={(v) => updateHolding(idx, 'name', v)}
                        placeholder="e.g. Apple Stock"
                        placeholderTextColor="#94a3b8"
                        className="text-slate-900 text-base"
                      />
                    </View>
                    <View className="px-4 py-3 border-b border-slate-100">
                      <Text className="text-xs font-medium text-slate-500 mb-1">UNIT</Text>
                      <TextInput
                        value={h.unitName}
                        onChangeText={(v) => updateHolding(idx, 'unitName', v)}
                        placeholder="e.g. shares"
                        placeholderTextColor="#94a3b8"
                        className="text-slate-900 text-base"
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => removeHolding(idx)}
                      className="px-4 py-3 items-center"
                    >
                      <Text className="text-red-500 text-sm font-medium">Remove</Text>
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
