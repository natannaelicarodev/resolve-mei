import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SuccessTransition } from '@/components/motion';
import { Text } from '@/components/ui';
import { AuthHeading, AuthScreen } from '@/features/auth/AuthVisual';
import { lightColors, spacing } from '@/theme';

export function maskEmail(value: string | undefined): string | null {
  if (!value) return null;
  const [local, domain] = value.split('@');
  if (!local || !domain) return null;
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(2, Math.min(6, local.length - 2)))}@${domain}`;
}

export default function ConfirmEmailRoute() {
  const params = useLocalSearchParams<{ email?: string }>();
  const maskedEmail = maskEmail(params.email);
  return (
    <AuthScreen contentContainerStyle={styles.screen}>
      <AuthHeading title="Confira seu e-mail">
        <Text style={styles.subtitle}>
          Enviamos um link para confirmar sua conta.
        </Text>
      </AuthHeading>
      <View style={styles.content}>
        <SuccessTransition
          haptic={false}
          message="Cadastro recebido com segurança."
        />
        {maskedEmail ? (
          <Text align="center" style={styles.email} variant="label">
            {maskedEmail}
          </Text>
        ) : null}
        <Text style={styles.body}>
          Abra o link no mesmo dispositivo e depois entre no aplicativo.
        </Text>
        <Text style={styles.body}>
          Confira também a pasta de spam. O envio pode levar alguns minutos.
        </Text>
        <Link href="/sign-in" style={styles.link}>
          Ir para entrar
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.xl, paddingTop: 255 },
  subtitle: { color: lightColors.textSecondary },
  content: { gap: spacing.lg },
  email: { color: lightColors.textPrimary, fontSize: 17 },
  body: { color: lightColors.textSecondary },
  link: { color: lightColors.primary, fontWeight: '700' },
});
