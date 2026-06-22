import type { ReactNode } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Eyebrow } from './Eyebrow';

// Editorial form row: mono label over a big value, hairline top rule.
// Pressable (pickers) or editable (TextInput) variants.
export function Field({
  label,
  value,
  placeholder,
  trailing,
  big = false,
  first = false,
  onPress,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  trailing?: ReactNode;
  big?: boolean;
  first?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <>
      <Eyebrow className="mb-1.5 text-[10.5px]">{label}</Eyebrow>
      <View className="flex-row items-center justify-between gap-2.5">
        <Text
          numberOfLines={1}
          className={`flex-1 font-sans-semibold ${big ? 'text-2xl' : 'text-[16.5px]'} ${
            value ? 'text-ink' : 'text-ink-3'
          }`}
          style={big ? { fontVariant: ['tabular-nums'] } : undefined}
        >
          {value || placeholder || ''}
        </Text>
        {trailing !== undefined ? (
          trailing
        ) : (
          <Ionicons name="chevron-down" size={16} color="#8C897D" />
        )}
      </View>
    </>
  );

  const cls = `pt-3.5 pb-3 ${first ? '' : 'border-t border-line'}`;
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.65} className={cls}>
        {body}
      </TouchableOpacity>
    );
  }
  return <View className={cls}>{body}</View>;
}

// Same chrome, but the value is an inline TextInput
export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  first = false,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize,
  trailing,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  first?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  trailing?: ReactNode;
}) {
  return (
    <View className={`pt-3.5 pb-3 ${first ? '' : 'border-t border-line'}`}>
      <Eyebrow className="mb-1.5 text-[10.5px]">{label}</Eyebrow>
      <View className="flex-row items-center justify-between gap-2.5">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B6B2A6"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          className="flex-1 font-sans-semibold text-[16.5px] text-ink p-0"
        />
        {trailing ?? null}
      </View>
    </View>
  );
}
