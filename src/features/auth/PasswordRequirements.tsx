import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { radii, spacing, useTheme } from '@/theme';

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
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundSubtle,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <Text color="textSecondary" variant="label">
        Sua senha precisa ter:
      </Text>
      {passwordRequirementChecks.map((requirement) => {
        const met = requirement.test(password);
        return (
          <View
            accessibilityLabel={`${requirement.label}: ${met ? 'atendido' : 'pendente'}`}
            accessible
            key={requirement.label}
            style={styles.requirement}
          >
            <Icon
              color={met ? 'success' : 'textMuted'}
              name={met ? 'success' : 'statusNeutral'}
              size="small"
            />
            <Text
              color={met ? 'success' : 'textMuted'}
              style={styles.requirementText}
              variant="caption"
            >
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
    borderRadius: radii.control,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing[2],
    padding: spacing[3],
  },
  requirement: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
  },
  requirementText: { flex: 1 },
});
