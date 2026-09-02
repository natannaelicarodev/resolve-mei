import { router } from 'expo-router';

import { Button, Card, Screen, Text } from '@/components/ui';

export default function NotFoundRoute() {
  return (
    <Screen contentContainerStyle={{ justifyContent: 'center' }}>
      <Card>
        <Text variant="pageTitle">Página não encontrada</Text>
        <Text variant="body">O endereço informado não existe.</Text>
        <Button label="Ir para o início" onPress={() => router.replace('/')} />
      </Card>
    </Screen>
  );
}
