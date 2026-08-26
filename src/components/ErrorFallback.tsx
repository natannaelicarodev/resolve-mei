import { Button, InlineFeedback, Screen, Text } from '@/components/ui';

export interface ErrorFallbackProps {
  onRetry?: () => void;
}

export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  return (
    <Screen contentContainerStyle={{ justifyContent: 'center' }}>
      <Text variant="pageTitle">Algo deu errado</Text>
      <InlineFeedback
        message="Não foi possível exibir esta tela com segurança."
        variant="error"
      />
      {onRetry ? <Button label="Tentar novamente" onPress={onRetry} /> : null}
    </Screen>
  );
}
