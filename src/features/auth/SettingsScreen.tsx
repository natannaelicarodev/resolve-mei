import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  ConfirmationDialog,
  InlineFeedback,
  Screen,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { triggerHaptic } from '@/lib/haptics';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme';

const themeOptions = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
] as const;

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [logoutConfirmationVisible, setLogoutConfirmationVisible] =
    useState(false);
  const logout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(undefined);
    try {
      await signOut();
      setLogoutConfirmationVisible(false);
      router.replace('/sign-in');
      void triggerHaptic('selection');
    } catch (caught) {
      setError(normalizeError(caught).message);
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Screen safeAreaEdges={[]}>
        <ProtectedPageHeader back title="Configurações" />
        <Card>
          <Text variant="cardTitle">Conta</Text>
          <Text color="textSecondary" variant="label">
            E-mail
          </Text>
          <Text>{user?.email}</Text>
        </Card>
        <Card>
          <Text variant="cardTitle">Aparência</Text>
          <Text color="textSecondary">
            Escolha como o ResolveMEI aparece neste dispositivo.
          </Text>
          <SegmentedControl
            label="Tema do aplicativo"
            onChange={(value) => void setPreference(value)}
            options={themeOptions}
            value={preference}
          />
        </Card>
        <Card>
          <Text variant="cardTitle">Sessão</Text>
          <Text color="textSecondary">Encerre o acesso neste dispositivo.</Text>
          {error ? <InlineFeedback message={error} variant="error" /> : null}
          <Button
            disabled={isLoading}
            label="Sair da conta"
            loading={isLoading}
            onPress={() => setLogoutConfirmationVisible(true)}
            variant="outline"
          />
        </Card>
        <ConfirmationDialog
          confirmLabel="Sair"
          description="Você precisará entrar novamente para acessar seus dados."
          destructive
          loading={isLoading}
          onCancel={() => setLogoutConfirmationVisible(false)}
          onConfirm={() => void logout()}
          title="Sair da conta?"
          visible={logoutConfirmationVisible}
        />
        <Card>
          <Text variant="cardTitle">Sobre</Text>
          <Text color="textSecondary">
            ResolveMEI {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </Card>
      </Screen>
    </SafeAreaView>
  );
}
