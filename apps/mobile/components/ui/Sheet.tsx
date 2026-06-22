import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Bottom sheet: dim scrim, grabber, rounded top — the design's SheetOver
export function Sheet({
  visible,
  onClose,
  title,
  children,
  tall = false,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  tall?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        <Pressable className="absolute inset-0 bg-ink/45" onPress={onClose} />
        <View
          className="bg-surface rounded-t-xl px-5 pt-2.5"
          style={{ maxHeight: tall ? '88%' : '70%', paddingBottom: insets.bottom + 24 }}
        >
          <View className="w-10 h-[4.5px] rounded-full bg-line-strong self-center mb-4" />
          {title ? (
            <Text className="font-sans-semibold text-lg text-ink tracking-tight mb-4">
              {title}
            </Text>
          ) : null}
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
