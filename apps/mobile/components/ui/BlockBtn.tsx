import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

// Full-width 54px editorial button
export function BlockBtn({
  children,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  destructive = false,
  className = '',
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  className?: string;
}) {
  const solid = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`h-[54px] rounded-[16px] flex-row items-center justify-center gap-2 ${
        solid ? 'bg-ink' : 'bg-transparent border border-line-strong'
      } ${disabled ? 'opacity-45' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={solid ? '#FAF9F6' : '#181712'} />
      ) : (
        <Text
          className={`font-sans-semibold text-base ${
            solid ? 'text-paper' : destructive ? 'text-negative' : 'text-ink'
          }`}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
