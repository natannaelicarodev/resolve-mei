import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, sizes, spacing } from '@/theme';

export interface ScreenProps extends PropsWithChildren<ScrollViewProps> {
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

export function Screen({
  children,
  contentContainerStyle,
  ...props
}: ScreenProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        {...props}
      >
        <View style={styles.content}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.md },
  content: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: sizes.contentMaxWidth,
    width: '100%',
  },
});
