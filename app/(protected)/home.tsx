import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { useMyBusiness } from '@/features/business/hooks';
import { colors, spacing } from '@/theme';

export default function HomeRoute() {
  const { data } = useMyBusiness();
  return (
    <Screen>
      <Text variant="title">{data?.business_name ?? 'ResolveMEI'}</Text>
      <Card>
        <Text variant="label">Perfil configurado</Text>
        <Text>
          Sua área autenticada está pronta. As ferramentas comerciais serão
          adicionadas nas próximas fases.
        </Text>
      </Card>
      <Link href="/profile" style={styles.link}>
        Editar perfil
      </Link>
      <Link href="/settings" style={styles.link}>
        Configurações
      </Link>
    </Screen>
  );
}
const styles = StyleSheet.create({
  link: { color: colors.primary, minHeight: 44, paddingVertical: spacing.sm },
});
