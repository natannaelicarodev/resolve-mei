import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Button, Card, Screen, Text } from '@/components/ui';
import { LoadingScreen } from '@/components/LoadingScreen';
import { handleAuthCallbackUrl } from '@/features/auth/api';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthCallbackRoute() {
  const url = Linking.useLinkingURL();
  const { beginPasswordRecovery } = useAuth();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!url) return;
    let active = true;
    void handleAuthCallbackUrl(url)
      .then((kind) => {
        if (active) {
          if (kind === 'recovery') beginPasswordRecovery();
          router.replace(kind === 'recovery' ? '/reset-password' : '/home');
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [beginPasswordRecovery, url]);

  if (!failed) return <LoadingScreen label="Validando link seguro..." />;
  return (
    <Screen contentContainerStyle={{ justifyContent: 'center' }}>
      <Card accessible accessibilityRole="alert">
        <Text variant="title">Link inválido</Text>
        <Text>
          O link expirou, já foi utilizado ou não pertence a este fluxo.
        </Text>
        <Button
          label="Voltar para entrar"
          onPress={() => router.replace('/sign-in')}
        />
      </Card>
    </Screen>
  );
}
