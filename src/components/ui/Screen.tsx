import type { PropsWithChildren, Ref } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Edge } from 'react-native-safe-area-context';

import { sizes, spacing, useTheme } from '@/theme';

export interface ScreenProps extends PropsWithChildren<ScrollViewProps> {
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  background?: 'default' | 'subtle';
  contentWidth?: 'default' | 'wide';
  scrollRef?: Ref<ScrollView>;
  safeAreaEdges?: readonly Edge[];
}

export function Screen({
  children,
  contentContainerStyle,
  scroll = true,
  keyboardAvoiding = false,
  background = 'default',
  contentWidth = 'default',
  scrollRef,
  safeAreaEdges = ['top', 'bottom'],
  ...props
}: ScreenProps) {
  const { colors } = useTheme();
  const content = (
    <View
      style={[styles.content, contentWidth === 'wide' && styles.contentWide]}
    >
      {children}
    </View>
  );
  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
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
      edges={safeAreaEdges}
      style={[
        styles.safeArea,
        {
          backgroundColor:
            background === 'subtle'
              ? colors.backgroundSubtle
              : colors.background,
        },
      ]}
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
  safeArea: { flex: 1 },
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
  contentWide: { maxWidth: sizes.contentWideMaxWidth },
});
