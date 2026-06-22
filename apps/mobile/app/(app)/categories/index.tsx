import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useCategories } from '@/lib/hooks';
import type { AccountType, CategoryData } from '@/lib/types';
import { Page } from '@/components/ui/Page';
import { Head, HeadAction } from '@/components/ui/Head';
import { ListBlock } from '@/components/ui/ListBlock';
import { Row } from '@/components/ui/Row';
import { Tile } from '@/components/ui/Tile';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Sheet } from '@/components/ui/Sheet';
import { Segs } from '@/components/ui/Segs';
import { BlockBtn } from '@/components/ui/BlockBtn';
import { CategoryIcon, categoryMeta, CATEGORY_ICON_KEYS } from '@/components/CategoryIcon';

type Scope = 'all' | 'EXPENSE' | 'INCOME';

function Badge({ children, neutral = false }: { children: string; neutral?: boolean }) {
  return (
    <View className={`px-2.5 py-[5px] rounded-full ${neutral ? 'bg-paper-2' : 'bg-positive-soft'}`}>
      <Text className={`font-sans-semibold text-xs ${neutral ? 'text-ink-2' : 'text-positive-2'}`}>
        {children}
      </Text>
    </View>
  );
}

// Bottom-sheet editor for create + edit (design: "Edit category" sheet)
function CategoryEditor({
  category,
  visible,
  onClose,
}: {
  category: CategoryData | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isNew = !category;
  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState(category?.icon ?? 'cart');
  const [scope, setScope] = useState<Scope>((category?.accountType as Scope) ?? 'all');
  const [newSub, setNewSub] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['categories'] });
  const onError = (err: any) =>
    Alert.alert(t('common.error'), err.response?.data?.message ?? t('common.error'));

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        icon,
        accountType: scope === 'all' ? null : (scope as AccountType),
      };
      return isNew
        ? api.post('/categories', { ...body, accountType: body.accountType ?? undefined })
        : api.patch(`/categories/${category!.id}`, body);
    },
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/categories/${category!.id}`),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError,
  });

  const addSubMutation = useMutation({
    mutationFn: (subName: string) =>
      api.post(`/categories/${category!.id}/sub-categories`, { name: subName }),
    onSuccess: () => {
      setNewSub('');
      invalidate();
    },
    onError,
  });

  const removeSubMutation = useMutation({
    mutationFn: (subId: string) => api.delete(`/categories/${category!.id}/sub-categories/${subId}`),
    onSuccess: invalidate,
    onError,
  });

  const scopeLabels: Record<Scope, string> = {
    all: t('categories.allTypes'),
    EXPENSE: t('accounts.type.EXPENSE'),
    INCOME: t('accounts.type.INCOME'),
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isNew ? t('categories.newTitle') : t('categories.editTitle')}
      tall
    >
      {/* Name + icon */}
      <View className="flex-row items-center gap-3.5 mb-2">
        <CategoryIcon icon={icon} size={48} />
        <View className="flex-1">
          <Eyebrow className="mb-1 text-[10.5px]">{t('categories.name')}</Eyebrow>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('categories.namePlaceholder')}
            placeholderTextColor="#B6B2A6"
            className="font-sans-semibold text-[19px] text-ink p-0"
          />
        </View>
      </View>

      {/* Icon picker */}
      <View className="flex-row flex-wrap gap-2 py-3">
        {CATEGORY_ICON_KEYS.map((key) => {
          const on = key === icon;
          const meta = categoryMeta(key);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setIcon(key)}
              activeOpacity={0.7}
              className={`rounded-md ${on ? 'border-2 border-ink' : 'border-2 border-transparent'}`}
            >
              <CategoryIcon icon={key} size={38} />
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="pt-4 pb-3 border-t border-line">
        <Eyebrow className="mb-2.5 text-[10.5px]">{t('categories.appliesTo')}</Eyebrow>
        <Segs
          options={['all', 'EXPENSE', 'INCOME'] as const}
          value={scope}
          onChange={setScope}
          labels={scopeLabels}
        />
      </View>

      {/* Subcategories — existing categories only (need an id to attach to) */}
      {!isNew ? (
        <View className="pt-3.5 border-t border-line">
          <Eyebrow className="mb-1 text-[10.5px]">{t('categories.subcategories')}</Eyebrow>
          {category!.subCategories.map((s, i) => (
            <Row
              key={s.id}
              first={i === 0}
              tile={<Tile icon="ellipse-outline" size={32} />}
              title={s.name}
              trailing={
                <TouchableOpacity onPress={() => removeSubMutation.mutate(s.id)} hitSlop={8}>
                  <Ionicons name="remove" size={16} color="#8C897D" />
                </TouchableOpacity>
              }
            />
          ))}
          <View className="flex-row items-center gap-2.5 py-3">
            <Ionicons name="add" size={16} color="#181712" />
            <TextInput
              value={newSub}
              onChangeText={setNewSub}
              placeholder={t('categories.addSubcategory')}
              placeholderTextColor="#8C897D"
              onSubmitEditing={() => newSub.trim() && addSubMutation.mutate(newSub.trim())}
              returnKeyType="done"
              className="flex-1 font-sans-semibold text-[14.5px] text-ink p-0"
            />
          </View>
        </View>
      ) : null}

      <View className="flex-row gap-2.5 mt-4">
        {!isNew ? (
          <View className="flex-1">
            <BlockBtn
              variant="secondary"
              destructive
              onPress={() =>
                Alert.alert(t('categories.deleteTitle'), t('categories.deleteMessage'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('categories.delete'),
                    style: 'destructive',
                    onPress: () => deleteMutation.mutate(),
                  },
                ])
              }
              loading={deleteMutation.isPending}
            >
              {t('categories.delete')}
            </BlockBtn>
          </View>
        ) : null}
        <View className={isNew ? 'flex-1' : 'flex-[2]'}>
          <BlockBtn
            onPress={() => name.trim() && saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!name.trim()}
          >
            {t('common.save')}
          </BlockBtn>
        </View>
      </View>
    </Sheet>
  );
}

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  // editing: undefined = closed, null = creating, CategoryData = editing
  const [editing, setEditing] = useState<CategoryData | null | undefined>(undefined);

  return (
    <Page>
      <Head
        eyebrow={t('categories.eyebrow')}
        title={t('categories.title')}
        trailing={<HeadAction icon="add" onPress={() => setEditing(null)} />}
      />
      <Text className="font-sans text-[13px] text-ink-3 -mt-2 mb-4">{t('categories.note')}</Text>

      {isLoading ? (
        <View className="py-16 items-center">
          <ActivityIndicator color="#181712" />
        </View>
      ) : (
        <ListBlock>
          {categories.map((c, i) => (
            <Row
              key={c.id}
              first={i === 0}
              tile={<CategoryIcon icon={c.icon} size={40} />}
              title={c.name}
              sub={
                c.subCategories.length
                  ? c.subCategories.map((s) => s.name).join(' · ')
                  : t('categories.noSubcategories')
              }
              trailing={
                <View className="flex-row items-center gap-2">
                  {c.accountType ? (
                    <Badge neutral>{t(`accounts.type.${c.accountType}`)}</Badge>
                  ) : (
                    <Badge neutral>{t('categories.allTypes')}</Badge>
                  )}
                  <Ionicons name="chevron-forward" size={16} color="#8C897D" />
                </View>
              }
              onPress={() => setEditing(c)}
            />
          ))}
        </ListBlock>
      )}

      {editing !== undefined ? (
        <CategoryEditor
          key={editing?.id ?? 'new'}
          category={editing}
          visible
          onClose={() => setEditing(undefined)}
        />
      ) : null}
    </Page>
  );
}
