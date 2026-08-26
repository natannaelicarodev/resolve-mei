import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { SuccessTransition } from '@/components/motion';
import { Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { useTheme } from '@/theme';

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
      title="Confira seu e-mail"
      subtitle="Enviamos um link para confirmar sua conta."
    >
      <SuccessTransition
        haptic={false}
        message="Cadastro recebido com segurança."
      />
      {maskedEmail ? (
        <Text align="center" variant="label">
          {maskedEmail}
        </Text>
      ) : null}
      <Text>
        Abra o link no mesmo dispositivo e depois entre no aplicativo.
      </Text>
      <Text>
        Confira também a pasta de spam. O envio pode levar alguns minutos.
      </Text>
      <Link href="/sign-in" style={[styles.link, { color: colors.primary }]}>
        Ir para entrar
      </Link>
    </AuthShell>
  );
}
const styles = StyleSheet.create({ link: {} });
