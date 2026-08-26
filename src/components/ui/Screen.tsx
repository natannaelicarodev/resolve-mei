import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, sizes, spacing } from '@/theme';

export interface ScreenProps extends PropsWithChildren<ScrollViewProps> {
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  background?: 'default' | 'subtle';
}

export function Screen({
  children,
  contentContainerStyle,
  scroll = true,
  keyboardAvoiding = false,
  background = 'default',
  ...props
}: ScreenProps) {
  const content = <View style={styles.content}>{children}</View>;
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...props}
    >
      {content}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.scrollContent,
        styles.staticContent,
        contentContainerStyle,
      ]}
    >
      {content}
    </View>
  );
  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.safeArea, background === 'subtle' && styles.subtle]}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  subtle: { backgroundColor: colors.backgroundSubtle },
  keyboard: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  staticContent: { flex: 1 },
  content: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: sizes.contentMaxWidth,
    width: '100%',
  },
});
