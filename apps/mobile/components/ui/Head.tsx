import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Eyebrow } from './Eyebrow';

// Editorial header: bordered back square + mono eyebrow + big tight title
export function Head({
  eyebrow,
  title,
  back = true,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  back?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <View className="mb-5">
      {(back || trailing) && (
        <View className="flex-row items-center justify-between mb-4 min-h-[36px]">
          {back ? (
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-sm border border-line-2 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={18} color="#181712" />
            </TouchableOpacity>
          ) : (
            <View />
          )}
          {trailing ?? null}
        </View>
      )}
      {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
      <Text className="font-sans-semibold text-3xl text-ink tracking-tight leading-tight">
        {title}
      </Text>
    </View>
  );
}

// Solid ink square action (the design's + button in headers)
export function HeadAction({
  icon,
  onPress,
  solid = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  solid?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={
        solid
          ? 'w-9 h-9 rounded-sm bg-ink items-center justify-center'
          : 'w-9 h-9 rounded-sm border border-line-2 items-center justify-center'
      }
    >
      <Ionicons name={icon} size={18} color={solid ? '#FAF9F6' : '#181712'} />
    </TouchableOpacity>
  );
}
