import type { ComponentProps } from 'react';
import { StyleSheet, Text as NativeText } from 'react-native';

import { colors, typography } from '@/theme';
import type { ColorToken, TypographyVariant } from '@/theme';

type NativeTextProps = ComponentProps<typeof NativeText>;
export interface TextProps extends NativeTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
}

export function Text({
  variant = 'body',
  color = 'textPrimary',
  align,
  truncate = false,
  style,
  ...props
}: TextProps) {
  return (
    <NativeText
      allowFontScaling
      ellipsizeMode={truncate ? 'tail' : props.ellipsizeMode}
      numberOfLines={
        truncate ? (props.numberOfLines ?? 1) : props.numberOfLines
      }
      style={[
        styles.base,
        typography[variant],
        { color: colors[color], textAlign: align },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({ base: { color: colors.textPrimary } });
