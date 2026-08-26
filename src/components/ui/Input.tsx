import { forwardRef, useId } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { colors, radii, sizes, spacing } from '@/theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, editable = true, style, ...props },
  ref,
) {
  const id = useId();
  return (
    <View style={styles.wrapper}>
      <Text nativeID={id} variant="label">
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityLabelledBy={id}
        accessibilityHint={error}
        accessibilityState={{ disabled: !editable }}
        editable={editable}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          !editable && styles.disabled,
          error && styles.errorInput,
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          style={styles.error}
          variant="caption"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  input: {
    minHeight: sizes.controlHeight,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
  },
  disabled: { backgroundColor: colors.disabled, color: colors.disabledText },
  errorInput: { borderColor: colors.danger },
  error: { color: colors.danger },
});
