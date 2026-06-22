import type { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

// Editorial list row: leading tile · title/sub · trailing, hairline separators
// (every row except the first draws a top border)
export function Row({
  tile,
  title,
  sub,
  trailing,
  first = false,
  onPress,
  onLongPress,
}: {
  tile?: ReactNode;
  title: string;
  sub?: ReactNode;
  trailing?: ReactNode;
  first?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const content = (
    <>
      {tile}
      <View className="flex-1 min-w-0">
        <Text numberOfLines={1} className="font-sans-semibold text-[15px] text-ink">
          {title}
        </Text>
        {sub ? (
          typeof sub === 'string' ? (
            <Text numberOfLines={1} className="font-sans text-[12.5px] text-ink-3 mt-px">
              {sub}
            </Text>
          ) : (
            sub
          )
        ) : null}
      </View>
      {trailing}
    </>
  );

  const rowClass = `flex-row items-center gap-3 py-3 ${first ? '' : 'border-t border-line'}`;
  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.65}
        className={rowClass}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return <View className={rowClass}>{content}</View>;
}
