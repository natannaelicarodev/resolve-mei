import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SuccessTransition } from '@/components/motion';
import { Button, Icon, Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { radii, spacing, useTheme } from '@/theme';

export function maskEmail(value: string | undefined): string | null {
  if (!value) return null;
  const [local, domain] = value.split('@');
  if (!local || !domain) return null;
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(2, Math.min(6, local.length - 2)))}@${domain}`;
}

export default function ConfirmEmailRoute() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const maskedEmail = maskEmail(params.email);
  return (
    <AuthShell
      heroSubtitle="Abra o link que enviamos para ativar sua conta com segurança."
      heroTitle="Só falta confirmar seu e-mail."
      subtitle="Enviamos um link para confirmar sua conta."
      title="Confira sua caixa de entrada"
    >
      <SuccessTransition
        haptic={false}
        message="Cadastro recebido com segurança."
      />
      {maskedEmail ? (
        <View
          accessibilityLabel={`E-mail enviado para ${maskedEmail}`}
          accessible
          style={[
            styles.emailCard,
            {
              backgroundColor: colors.primarySubtle,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.emailIcon, { backgroundColor: colors.primaryMuted }]}
          >
            <Icon color="primary" name="email" size="medium" />
          </View>
          <View style={styles.emailCopy}>
            <Text color="textSecondary" variant="caption">
              Link enviado para
            </Text>
            <Text variant="label">{maskedEmail}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.instructions}>
        <Text variant="label">Próximos passos</Text>
        <View style={styles.instructionRow}>
          <Icon color="textMuted" name="email" size="small" />
          <Text
            color="textSecondary"
            style={styles.instructionText}
            variant="bodySmall"
          >
            Abra o link no mesmo dispositivo e depois volte ao aplicativo.
          </Text>
        </View>
        <View style={styles.instructionRow}>
          <Icon color="textMuted" name="statusInfo" size="small" />
          <Text
            color="textSecondary"
            style={styles.instructionText}
            variant="bodySmall"
          >
            Se não encontrar a mensagem, confira a pasta de spam. O envio pode
            levar alguns minutos.
          </Text>
        </View>
      </View>
      <Button
        label="Ir para entrar"
        onPress={() => router.replace('/sign-in')}
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  emailCard: {
    alignItems: 'center',
    borderRadius: radii.control,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[3],
  },
  emailCopy: { flex: 1, gap: spacing[1] },
  emailIcon: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  instructions: { gap: spacing[3] },
  instructionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing[2],
  },
  instructionText: { flex: 1 },
});
