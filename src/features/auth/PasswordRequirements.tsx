import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

export const passwordRequirementChecks = [
  { label: '8 ou mais caracteres', test: (value: string) => value.length >= 8 },
  {
    label: 'Uma letra minúscula',
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: 'Uma letra maiúscula',
    test: (value: string) => /[A-Z]/.test(value),
  },
  { label: 'Um número', test: (value: string) => /[0-9]/.test(value) },
] as const;

export function PasswordRequirements({ password }: { password: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel="Requisitos da senha"
      style={[styles.container, { borderLeftColor: colors.borderStrong }]}
    >
      {passwordRequirementChecks.map((requirement) => {
        const met = requirement.test(password);
        return (
          <Text
            accessibilityLabel={`${requirement.label}: ${met ? 'atendido' : 'pendente'}`}
            color={met ? 'success' : 'textMuted'}
            key={requirement.label}
            variant="caption"
          >
            • {requirement.label}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 2,
    gap: spacing.xs,
    paddingLeft: spacing.sm,
  },
});
