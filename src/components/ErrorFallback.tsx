import { Button, Card, Screen, Text } from '@/components/ui';

export interface ErrorFallbackProps {
  onRetry?: () => void;
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  return (
    <Screen contentContainerStyle={{ justifyContent: 'center' }}>
      <Card accessible accessibilityRole="alert">
        <Text variant="title">Algo deu errado</Text>
        <Text>Não foi possível exibir esta tela com segurança.</Text>
        {onRetry ? <Button label="Tentar novamente" onPress={onRetry} /> : null}
      </Card>
    </Screen>
  );
}
