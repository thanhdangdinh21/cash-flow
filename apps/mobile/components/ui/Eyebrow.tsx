import { Text } from 'react-native';

// Mono uppercase micro-label ("TOTAL ASSETS", "WHERE IT SITS")
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <Text className={`font-mono-semibold text-2xs uppercase tracking-[1.5px] text-ink-3 ${className}`}>
      {children}
    </Text>
  );
}
