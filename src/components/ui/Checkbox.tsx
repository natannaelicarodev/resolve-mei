import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, sizes, spacing } from '@/theme';
import { Text } from './Text';

interface CheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function Checkbox({ checked, label, onChange, error }: CheckboxProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View style={[styles.box, checked && styles.checked]}>
          {checked ? <Text style={styles.mark}>✓</Text> : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? (
        <Text style={styles.error} variant="caption">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: sizes.touchTarget,
  },
  box: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  mark: { color: colors.textOnPrimary, fontWeight: '700' },
  label: { flex: 1 },
  error: { color: colors.danger },
});
