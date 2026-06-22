import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import {
  useAccounts,
  useCategories,
  useContactLoans,
  useContacts,
  useMoneyInvalidation,
} from '@/lib/hooks';
import { currencySymbol, fieldDate, money, num } from '@/lib/format';
import type {
  AccountData,
  CategoryData,
  ContactData,
  LoanData,
  SubCategoryData,
  TransactionType,
} from '@/lib/types';
import { Page } from '@/components/ui/Page';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Field, InputField } from '@/components/ui/Field';
import { Segs } from '@/components/ui/Segs';
import { BlockBtn } from '@/components/ui/BlockBtn';
import { Sheet } from '@/components/ui/Sheet';
import { Row } from '@/components/ui/Row';
import { Tile } from '@/components/ui/Tile';
import { CategoryIcon } from '@/components/CategoryIcon';

const TYPES = ['EXPENSE', 'INCOME', 'TRANSFER', 'LOAN'] as const;

// The four debt directions (design: 2×2 grid). Lent/Borrowed open a new loan;
// Collected/Repaid settle an existing one.
type DebtDir = 'LENT' | 'BORROWED' | 'COLLECTED' | 'REPAID';
const DEBT_DIRS: { id: DebtDir; in: boolean; newDebt: boolean }[] = [
  { id: 'LENT', in: false, newDebt: true },
  { id: 'BORROWED', in: true, newDebt: true },
  { id: 'COLLECTED', in: true, newDebt: false },
  { id: 'REPAID', in: false, newDebt: false },
];

type PickerKind = 'account' | 'counterAccount' | 'category' | 'contact' | 'loan' | 'date' | null;

export default function AddTransactionScreen() {
  const { t } = useTranslation();
  const invalidate = useMoneyInvalidation();

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: contacts = [] } = useContacts();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [debtDir, setDebtDir] = useState<DebtDir>('LENT');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState<AccountData | null>(null);
  const [counterAccount, setCounterAccount] = useState<AccountData | null>(null);
  const [subCategory, setSubCategory] = useState<(SubCategoryData & { categoryName: string; icon: string }) | null>(null);
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [interestRate, setInterestRate] = useState('');
  const [interestPeriod, setInterestPeriod] = useState<'yearly' | 'monthly'>('yearly');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [picker, setPicker] = useState<PickerKind>(null);

  const dir = DEBT_DIRS.find((d) => d.id === debtDir)!;
  const { data: contactLoans = [] } = useContactLoans(
    type === 'LOAN' && !dir.newDebt ? contact?.id : undefined,
  );

  // Wallet-ish accounts only; system legs are resolved server-side
  const walletAccounts = useMemo(
    () => accounts.filter((a) => a.type === 'ASSET' || a.type === 'LIABILITY'),
    [accounts],
  );
  const defaultAccount = walletAccounts[0] ?? null;
  const fromAccount = account ?? defaultAccount;
  const currency = fromAccount?.currencyCode;
  const symbol = currencySymbol(currency);

  const scopedCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.accountType === null || c.accountType === (type === 'INCOME' ? 'INCOME' : 'EXPENSE'),
      ),
    [categories, type],
  );
  // Quick picks: first four categories that have a selectable subcategory
  const quickPicks = useMemo(
    () => scopedCategories.filter((c) => c.subCategories.length > 0).slice(0, 4),
    [scopedCategories],
  );

  const settleLoans = contactLoans.filter(
    (l) => l.direction === (debtDir === 'COLLECTED' ? 'LENT' : 'BORROWED'),
  );

  const amountNum = parseFloat(amount || '0');
  const moneyIn = type === 'INCOME' || (type === 'LOAN' && dir.in);
  const amountColor = moneyIn ? 'text-positive' : 'text-ink';
  const amountPrefix =
    type === 'TRANSFER' ? symbol : moneyIn ? `+ ${symbol}` : `− ${symbol}`;

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/transactions', {
        transactionType: type,
        amount: amountNum,
        date: date.toISOString(),
        accountId: fromAccount!.id,
        description: description.trim() || undefined,
        ...(type !== 'LOAN' && subCategory && { subCategoryId: subCategory.id }),
        ...(type === 'TRANSFER' && { counterAccountId: counterAccount?.id }),
        ...(type === 'LOAN' &&
          (dir.newDebt
            ? {
                loanDirection: debtDir,
                ...(contact ? { contactId: contact.id } : { contactName: newContactName.trim() }),
                ...(interestRate && {
                  interestRate: parseFloat(interestRate),
                  interestPeriod,
                }),
              }
            : { loanId: loan?.id })),
      }),
    onSuccess: () => {
      invalidate();
      router.back();
    },
    onError: (err: any) =>
      Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.error')),
  });

  function validate(): string | null {
    if (!amountNum || amountNum <= 0) return t('add.errors.amount');
    if (!fromAccount) return t('add.errors.account');
    if (type === 'TRANSFER') {
      if (!counterAccount) return t('add.errors.toAccount');
      if (counterAccount.id === fromAccount.id) return t('add.errors.sameAccount');
    }
    if (type === 'LOAN') {
      if (dir.newDebt && !contact && !newContactName.trim()) return t('add.errors.contact');
      if (!dir.newDebt && !loan) return t('add.errors.loan');
      if (!dir.newDebt && loan && amountNum > num(loan.remainingAmount))
        return t('add.errors.overRemaining');
    }
    return null;
  }

  function handleSave() {
    const error = validate();
    if (error) {
      Alert.alert(t('common.error'), error);
      return;
    }
    createMutation.mutate();
  }

  const saveLabel =
    type === 'TRANSFER'
      ? t('add.save.transfer')
      : type === 'LOAN'
        ? dir.newDebt
          ? t('add.save.debt')
          : debtDir === 'COLLECTED'
            ? t('add.save.collection')
            : t('add.save.repayment')
        : t('add.save.default');

  const typeLabels = {
    EXPENSE: t('add.types.expense'),
    INCOME: t('add.types.income'),
    TRANSFER: t('add.types.transfer'),
    LOAN: t('add.types.loan'),
  } as const;

  const counterparty = dir.newDebt
    ? (contact?.name ?? (newContactName.trim() || undefined))
    : contact?.name;

  return (
    <Page padTop={Platform.OS === 'ios' ? false : true} bottom={24}>
      {/* Close + title */}
      <View className="flex-row items-center justify-between mt-4 mb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="w-9 h-9 rounded-sm border border-line-2 items-center justify-center"
        >
          <Ionicons name="close" size={17} color="#181712" />
        </TouchableOpacity>
        <Eyebrow>{t('add.title')}</Eyebrow>
        <View className="w-9" />
      </View>

      {/* Type chips — one page, the fields below swap */}
      <View className="mb-1.5">
        <Segs options={TYPES} value={type} onChange={setType} labels={typeLabels} wrap />
      </View>

      {/* Amount */}
      <View className="pt-4 pb-3.5 border-b border-line">
        <Eyebrow className="mb-2 text-[10.5px]">{t('add.amount')}</Eyebrow>
        <View className="flex-row items-center">
          <Text
            className={`font-sans-semibold ${amountColor}`}
            style={{ fontSize: 40, letterSpacing: -1.2 }}
          >
            {amountPrefix}
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#B6B2A6"
            keyboardType="decimal-pad"
            autoFocus
            className={`flex-1 font-sans-semibold p-0 ${amountColor}`}
            style={{ fontSize: 40, letterSpacing: -1.2 }}
          />
        </View>
        {type === 'TRANSFER' ? (
          <Text className="font-sans text-[12.5px] text-ink-3 mt-1.5">{t('add.transferHint')}</Text>
        ) : null}
      </View>

      {/* EXPENSE / INCOME fields */}
      {type === 'EXPENSE' || type === 'INCOME' ? (
        <View>
          {quickPicks.length > 0 ? (
            <View className="flex-row gap-3 pt-3.5 pb-0.5">
              {quickPicks.map((c) => {
                const selected = subCategory && c.subCategories.some((s) => s.id === subCategory.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      const s = c.subCategories[0];
                      setSubCategory({ ...s, categoryName: c.name, icon: c.icon });
                    }}
                    activeOpacity={0.7}
                    className="items-center gap-1.5"
                  >
                    <View className={selected ? 'rounded-[14px] border-2 border-ink' : 'rounded-[14px] border-2 border-transparent'}>
                      <CategoryIcon icon={c.icon} size={44} />
                    </View>
                    <Text className="font-sans text-[10.5px] text-ink-3">{c.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          <Field
            label={t('add.category')}
            value={subCategory ? `${subCategory.categoryName} · ${subCategory.name}` : undefined}
            placeholder={t('add.categoryLater')}
            onPress={() => setPicker('category')}
          />
          <Field
            label={type === 'INCOME' ? t('add.toAccount') : t('add.fromAccount')}
            value={fromAccount?.name}
            placeholder={t('add.pickAccount')}
            onPress={() => setPicker('account')}
          />
        </View>
      ) : null}

      {/* TRANSFER fields */}
      {type === 'TRANSFER' ? (
        <View>
          <Field
            label={t('add.fromAccount')}
            value={
              fromAccount
                ? `${fromAccount.name} · ${money(num(fromAccount.currentBalance), { currency: fromAccount.currencyCode })}`
                : undefined
            }
            placeholder={t('add.pickAccount')}
            onPress={() => setPicker('account')}
          />
          <View className="items-center -my-1.5 z-10">
            <TouchableOpacity
              onPress={() => {
                if (counterAccount) {
                  setAccount(counterAccount);
                  setCounterAccount(fromAccount);
                }
              }}
              activeOpacity={0.7}
              className="w-8 h-8 rounded-full bg-paper-2 items-center justify-center"
            >
              <Ionicons name="swap-vertical" size={16} color="#181712" />
            </TouchableOpacity>
          </View>
          <Field
            label={t('add.toAccount')}
            value={
              counterAccount
                ? `${counterAccount.name} · ${money(num(counterAccount.currentBalance), { currency: counterAccount.currencyCode })}`
                : undefined
            }
            placeholder={t('add.pickAccount')}
            onPress={() => setPicker('counterAccount')}
          />
        </View>
      ) : null}

      {/* LOAN fields */}
      {type === 'LOAN' ? (
        <View>
          {/* Direction 2×2 grid */}
          <View className="pt-3 pb-3.5 border-b border-line">
            <Eyebrow className="mb-2 text-[10.5px]">{t('add.direction')}</Eyebrow>
            <View className="flex-row flex-wrap" style={{ gap: 7 }}>
              {DEBT_DIRS.map((d) => {
                const on = d.id === debtDir;
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => {
                      setDebtDir(d.id);
                      setLoan(null);
                    }}
                    activeOpacity={0.8}
                    className={`rounded-md px-3 pt-2 pb-2.5 border ${
                      on ? 'bg-ink border-ink' : 'bg-transparent border-line-2'
                    }`}
                    style={{ width: '48%' }}
                  >
                    <Text
                      className={`font-sans-semibold text-[13.5px] ${on ? 'text-paper' : 'text-ink-2'}`}
                    >
                      {t(`add.debt.${d.id}.label`)}
                    </Text>
                    <Text
                      className={`font-sans text-[10.5px] mt-0.5 ${on ? 'text-paper opacity-70' : 'text-ink-3'}`}
                    >
                      {t(`add.debt.${d.id}.sub`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Field
            label={dir.in ? t('add.toAccount') : t('add.fromAccount')}
            value={fromAccount?.name}
            placeholder={t('add.pickAccount')}
            onPress={() => setPicker('account')}
          />
          <Field
            label={
              debtDir === 'LENT' || debtDir === 'COLLECTED'
                ? t('add.borrower')
                : t('add.lender')
            }
            value={counterparty}
            placeholder={t('add.pickContact')}
            trailing={<Ionicons name="people-outline" size={16} color="#8C897D" />}
            onPress={() => setPicker('contact')}
          />
          {!dir.newDebt && contact ? (
            <Field
              label={t('add.loan')}
              value={
                loan
                  ? `${money(num(loan.principal), { currency })} · ${t('add.remaining', {
                      amount: money(num(loan.remainingAmount), { currency }),
                    })}`
                  : undefined
              }
              placeholder={t('add.pickLoan')}
              onPress={() => setPicker('loan')}
            />
          ) : null}
          {dir.newDebt ? (
            <View className="pt-3.5 pb-3 border-t border-line">
              <Eyebrow className="mb-1.5 text-[10.5px]">{t('add.interest')}</Eyebrow>
              <View className="flex-row items-center gap-3">
                <TextInput
                  value={interestRate}
                  onChangeText={setInterestRate}
                  placeholder="0"
                  placeholderTextColor="#B6B2A6"
                  keyboardType="decimal-pad"
                  className="font-sans-semibold text-[16.5px] text-ink p-0 min-w-[40px]"
                />
                <Text className="font-sans-semibold text-[16.5px] text-ink-3">%</Text>
                <Segs
                  options={['yearly', 'monthly'] as const}
                  value={interestPeriod}
                  onChange={setInterestPeriod}
                  labels={{ yearly: t('add.yearly'), monthly: t('add.monthly') }}
                />
              </View>
            </View>
          ) : null}
          {!dir.newDebt && loan && amountNum > 0 ? (
            <Text className="font-sans text-[12.5px] text-ink-3 pt-2.5">
              {t(debtDir === 'COLLECTED' ? 'add.remainingHintLent' : 'add.remainingHintBorrowed', {
                name: contact?.name,
                total: money(num(loan.remainingAmount), { currency }),
                left: money(Math.max(0, num(loan.remainingAmount) - amountNum), { currency }),
              })}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Date — all types */}
      <Field
        label={t('add.date')}
        value={fieldDate(date)}
        trailing={<Ionicons name="calendar-outline" size={16} color="#8C897D" />}
        onPress={() => setPicker('date')}
      />

      {/* Extras */}
      <InputField
        label={t('add.description')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('add.optional')}
        trailing={<View />}
      />
      <View className="flex-row items-center gap-2 py-3">
        <Ionicons name="attach" size={15} color="#8C897D" />
        <Text className="font-sans text-[13px] text-ink-3">{t('add.addReceipt')}</Text>
      </View>

      <View className="mt-auto pt-4">
        <BlockBtn onPress={handleSave} loading={createMutation.isPending}>
          {saveLabel}
        </BlockBtn>
      </View>

      {/* ── Pickers ── */}
      <Sheet
        visible={picker === 'account' || picker === 'counterAccount'}
        onClose={() => setPicker(null)}
        title={picker === 'counterAccount' ? t('add.toAccount') : t('add.pickAccount')}
      >
        {walletAccounts.map((a, i) => (
          <Row
            key={a.id}
            first={i === 0}
            tile={<Tile icon="wallet-outline" />}
            title={a.name}
            sub={t(`accounts.type.${a.type}`)}
            trailing={
              <Text className="font-sans text-sm text-ink-3" style={{ fontVariant: ['tabular-nums'] }}>
                {money(num(a.currentBalance), { cents: false, currency: a.currencyCode })}
              </Text>
            }
            onPress={() => {
              if (picker === 'counterAccount') setCounterAccount(a);
              else setAccount(a);
              setPicker(null);
            }}
          />
        ))}
      </Sheet>

      <Sheet
        visible={picker === 'category'}
        onClose={() => setPicker(null)}
        title={t('add.category')}
        tall
      >
        {scopedCategories.map((c, i) => (
          <View key={c.id} className={i === 0 ? '' : 'border-t border-line'}>
            <View className="flex-row items-center gap-3 pt-3 pb-1.5">
              <CategoryIcon icon={c.icon} size={34} />
              <Text className="font-sans-semibold text-[15px] text-ink">{c.name}</Text>
            </View>
            <View className="flex-row flex-wrap gap-2 pb-3 pl-[46px]">
              {c.subCategories.map((s) => {
                const on = subCategory?.id === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => {
                      setSubCategory({ ...s, categoryName: c.name, icon: c.icon });
                      setPicker(null);
                    }}
                    activeOpacity={0.7}
                    className={`px-3 py-1.5 rounded-full border ${
                      on ? 'bg-ink border-ink' : 'border-line-2'
                    }`}
                  >
                    <Text
                      className={`font-sans-medium text-[13px] ${on ? 'text-paper' : 'text-ink-2'}`}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {c.subCategories.length === 0 ? (
                <Text className="font-sans text-[12.5px] text-ink-4">
                  {t('categories.noSubcategories')}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </Sheet>

      <Sheet
        visible={picker === 'contact'}
        onClose={() => setPicker(null)}
        title={debtDir === 'LENT' || debtDir === 'COLLECTED' ? t('add.borrower') : t('add.lender')}
      >
        {contacts.map((c, i) => (
          <Row
            key={c.id}
            first={i === 0}
            tile={<Tile icon="person-outline" />}
            title={c.name}
            sub={
              num(c.balance) !== 0
                ? t(num(c.balance) > 0 ? 'add.owesYou' : 'add.youOwe', {
                    amount: money(Math.abs(num(c.balance)), { cents: false, currency }),
                  })
                : undefined
            }
            onPress={() => {
              setContact(c);
              setNewContactName('');
              setLoan(null);
              setPicker(null);
            }}
          />
        ))}
        {dir.newDebt ? (
          <View className={`flex-row items-center gap-2.5 py-3 ${contacts.length ? 'border-t border-line' : ''}`}>
            <Ionicons name="add" size={16} color="#181712" />
            <TextInput
              value={newContactName}
              onChangeText={setNewContactName}
              placeholder={t('add.newContact')}
              placeholderTextColor="#8C897D"
              onSubmitEditing={() => {
                if (newContactName.trim()) {
                  setContact(null);
                  setPicker(null);
                }
              }}
              returnKeyType="done"
              className="flex-1 font-sans-semibold text-[14.5px] text-ink p-0"
            />
          </View>
        ) : null}
      </Sheet>

      <Sheet visible={picker === 'loan'} onClose={() => setPicker(null)} title={t('add.pickLoan')}>
        {settleLoans.length === 0 ? (
          <Text className="font-sans text-sm text-ink-4 py-4">{t('add.noActiveLoans')}</Text>
        ) : (
          settleLoans.map((l, i) => (
            <Row
              key={l.id}
              first={i === 0}
              tile={<Tile icon="people-outline" />}
              title={money(num(l.principal), { currency })}
              sub={`${fieldDate(new Date(l.date))}${l.interestRate ? ` · ${num(l.interestRate)}% ${l.interestPeriod}` : ''}`}
              trailing={
                <Text className="font-sans text-sm text-ink-3" style={{ fontVariant: ['tabular-nums'] }}>
                  {t('add.remaining', { amount: money(num(l.remainingAmount), { currency }) })}
                </Text>
              }
              onPress={() => {
                setLoan(l);
                setPicker(null);
              }}
            />
          ))
        )}
      </Sheet>

      <Sheet visible={picker === 'date'} onClose={() => setPicker(null)} title={t('add.date')}>
        <View className="items-center">
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_, d) => {
              if (d) setDate(d);
              if (Platform.OS !== 'ios') setPicker(null);
            }}
            accentColor="#181712"
            maximumDate={new Date()}
          />
        </View>
        {Platform.OS === 'ios' ? (
          <BlockBtn onPress={() => setPicker(null)}>{t('common.save')}</BlockBtn>
        ) : null}
      </Sheet>
    </Page>
  );
}
