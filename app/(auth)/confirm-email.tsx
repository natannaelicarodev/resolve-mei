import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { AuthShell } from '@/features/auth/AuthShell';
import { colors } from '@/theme';

export default function ConfirmEmailRoute() {
  return (
    <AuthShell
      title="Confirme seu e-mail"
      subtitle="Cadastro recebido com segurança"
    >
      <Text>
        Enviamos uma mensagem de confirmação. Abra o link no mesmo dispositivo e
        depois entre no aplicativo.
      </Text>
      <Text>
        Confira também a pasta de spam. O envio pode levar alguns minutos.
      </Text>
      <Link href="/sign-in" style={styles.link}>
        Ir para entrar
      </Link>
    </AuthShell>
  );
}
const styles = StyleSheet.create({ link: { color: colors.primary } });
