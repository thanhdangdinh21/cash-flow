import { Text } from 'react-native';
import { money, num } from '@/lib/format';

// Signed amount with the design's tone rules:
// income/positive = green with "+", outflow = ink with "−"
export function AmountText({
  value,
  currency,
  cents = true,
  size = 15,
  muted = false,
  negativeRed = false,
}: {
  value: number | string;
  currency?: string;
  cents?: boolean;
  size?: number;
  muted?: boolean;
  negativeRed?: boolean;
}) {
  const n = num(value);
  const positive = n > 0;
  const color = positive
    ? 'text-positive'
    : negativeRed && n < 0
      ? 'text-negative'
      : muted
        ? 'text-ink-3'
        : 'text-ink';
  return (
    <Text
      className={`font-sans-semibold ${color}`}
      style={{ fontSize: size, fontVariant: ['tabular-nums'], letterSpacing: -0.15 }}
    >
      {money(n, { sign: true, cents, currency })}
    </Text>
  );
}
