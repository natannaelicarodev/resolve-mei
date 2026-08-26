import type { ComponentProps } from 'react';
import { StyleSheet, Text as NativeText } from 'react-native';

import { colors, typography } from '@/theme';

type NativeTextProps = ComponentProps<typeof NativeText>;
type TextVariant = keyof typeof typography;

export interface TextProps extends NativeTextProps {
  variant?: TextVariant;
}

export function Text({ variant = 'body', style, ...props }: TextProps) {
  return (
    <NativeText style={[styles.base, typography[variant], style]} {...props} />
  );
}

const styles = StyleSheet.create({ base: { color: colors.text } });
