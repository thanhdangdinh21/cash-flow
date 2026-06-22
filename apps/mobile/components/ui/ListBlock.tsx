import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Eyebrow } from './Eyebrow';

// Hairline list section: top rule, mono eyebrow + optional trailing, full-bleed rows
export function ListBlock({
  eyebrow,
  trailing,
  children,
  className = '',
}: {
  eyebrow?: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={`border-t border-line-2 ${className}`}>
      {eyebrow ? (
        <View className="flex-row items-baseline justify-between mt-3.5 mb-0.5">
          <Eyebrow>{eyebrow}</Eyebrow>
          {typeof trailing === 'string' ? (
            <Text className="font-sans-semibold text-[13px] text-ink-3">{trailing}</Text>
          ) : (
            trailing ?? null
          )}
        </View>
      ) : null}
      {children}
    </View>
  );
}
