import { forwardRef, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { radii, sizes, spacing, typography, useTheme } from '@/theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  helperText?: string;
  showCounter?: boolean;
  reserveMessageSpace?: boolean;
  readOnly?: boolean;
  rightAccessory?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    showCounter = false,
    reserveMessageSpace = true,
    readOnly = false,
    rightAccessory,
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
      <Text nativeID={id} variant="label">
        {label}
      </Text>
      <View style={styles.inputContainer}>
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
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
            Boolean(value) && { borderColor: colors.borderStrong },
            focused && { borderColor: colors.focusRing, borderWidth: 2 },
            !isEditable && {
              backgroundColor: colors.disabled,
              color: colors.disabledText,
            },
            error && { borderColor: colors.danger, borderWidth: 2 },
            Boolean(rightAccessory) && styles.inputWithAccessory,
            style,
          ]}
          value={value}
          {...props}
        />
        {rightAccessory ? (
          <View style={styles.rightAccessory}>{rightAccessory}</View>
        ) : null}
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
  inputContainer: { position: 'relative' },
  input: {
    minHeight: sizes.inputHeight,
    borderRadius: radii.medium,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    ...typography.body,
  },
  inputWithAccessory: { paddingRight: 56 },
  rightAccessory: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 44,
  },
  messageRow: { flexDirection: 'row', justifyContent: 'space-between' },
  messageSpace: { minHeight: 18 },
});
