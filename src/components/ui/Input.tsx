import { forwardRef, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { radii, sizes, spacing, typography, useTheme } from '@/theme';
import type { ColorToken } from '@/theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label: string;
  /** Overrides the label's color, e.g. `textInverse` over a colored band. */
  labelColor?: ColorToken;
  error?: string;
  helperText?: string;
  showCounter?: boolean;
  reserveMessageSpace?: boolean;
  readOnly?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    labelColor = 'textPrimary',
    error,
    helperText,
    showCounter = false,
    reserveMessageSpace = true,
    readOnly = false,
    leading,
    trailing,
    editable = true,
    maxLength,
    value,
    onFocus,
    onBlur,
    style,
    ...props
  },
  ref,
) {
  const { colors } = useTheme();
  const id = useId();
  const [focused, setFocused] = useState(false);
  const isEditable = editable && !readOnly;
  const message = error ?? helperText;
  return (
    <View style={styles.wrapper}>
      <Text color={labelColor} nativeID={id} variant="label">
        {label}
      </Text>
      <View style={styles.field}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityLabelledBy={id}
          accessibilityHint={message}
          accessibilityState={{ disabled: !isEditable }}
          editable={isEditable}
          maxLength={maxLength}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            Boolean(leading) && styles.inputLeading,
            Boolean(trailing) && styles.inputTrailing,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              color: colors.textPrimary,
            },
            Boolean(value) && { borderColor: colors.borderStrong },
            focused && { borderColor: colors.focusRing, borderWidth: 2 },
            !isEditable && {
              backgroundColor: colors.surfaceDisabled,
              color: colors.textDisabled,
            },
            error && { borderColor: colors.danger, borderWidth: 2 },
            style,
          ]}
          value={value}
          {...props}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      <View
        style={[styles.messageRow, reserveMessageSpace && styles.messageSpace]}
      >
        {message ? (
          <Text
            accessibilityLiveRegion={error ? 'polite' : 'none'}
            color={error ? 'danger' : 'textMuted'}
            variant="caption"
          >
            {message}
          </Text>
        ) : null}
        {showCounter && maxLength ? (
          <Text color="textMuted" variant="caption">
            {value?.length ?? 0}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  field: { position: 'relative' },
  input: {
    minHeight: sizes.inputHeight,
    borderRadius: radii.medium,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  inputLeading: { paddingLeft: 44 },
  inputTrailing: { paddingRight: 52 },
  leading: {
    left: spacing.md,
    position: 'absolute',
    top: 18,
    zIndex: 1,
  },
  trailing: {
    position: 'absolute',
    right: 4,
    top: 4,
    zIndex: 1,
  },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  messageSpace: { minHeight: 18 },
});
