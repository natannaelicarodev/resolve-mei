import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
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
          <View
            accessible
            accessibilityLabel={`${requirement.label}: ${met ? 'atendido' : 'pendente'}`}
            key={requirement.label}
            style={styles.requirement}
          >
            <View accessibilityElementsHidden importantForAccessibility="no">
              <Icon
                color={met ? 'success' : 'textMuted'}
                name={met ? 'success' : 'statusNeutral'}
                size="small"
              />
            </View>
            <Text color={met ? 'success' : 'textMuted'} variant="caption">
              {requirement.label}
            </Text>
          </View>
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
  requirement: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
});
