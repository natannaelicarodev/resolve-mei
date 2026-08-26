import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const logout = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      await signOut();
    } catch (caught) {
      setError(normalizeError(caught).message);
      setIsLoading(false);
    }
  };
  return (
    <Screen>
      <Card>
        <Text variant="label">Conta</Text>
        <Text>{user?.email}</Text>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          label="Sair"
          loading={isLoading}
          onPress={() => void logout()}
          variant="secondary"
        />
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({ error: { color: colors.danger } });
