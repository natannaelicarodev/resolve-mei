import Constants from 'expo-constants';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  ConfirmationDialog,
  Icon,
  InlineFeedback,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { triggerHaptic } from '@/lib/haptics';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
import { radii, sizes, spacing, useTheme } from '@/theme';

const themeOptions = [
  { label: 'Sistema', value: 'system' },
  { label: 'Claro', value: 'light' },
  { label: 'Escuro', value: 'dark' },
] as const;

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { colors, preference, setPreference } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
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
      style={[styles.page, { backgroundColor: colors.primary }]}
    >
      <StatusBar style="light" />
      <View
        style={[
          styles.band,
          { backgroundColor: colors.primary, width: windowWidth + 4 },
        ]}
      >
        <ProtectedPageHeader
          alwaysUseBackFallback
          back
          foregroundColor={colors.textInverse}
          title="Configurações"
        />
      </View>
      <View style={[styles.body, { backgroundColor: colors.backgroundSubtle }]}>
        <View style={styles.content}>
          <Card title="Conta">
            <View style={styles.row}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: colors.primarySubtle },
                ]}
              >
                <Icon name="email" rawColor={colors.primary} size="small" />
              </View>
              <View style={styles.rowBody}>
                <Text color="textSecondary" variant="caption">
                  E-mail
                </Text>
                <Text>{user?.email}</Text>
              </View>
            </View>
          </Card>
          <Card title="Aparência">
            <View style={styles.row}>
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: colors.primarySubtle },
                ]}
              >
                <Icon
                  name="appearance"
                  rawColor={colors.primary}
                  size="small"
                />
              </View>
              <View style={styles.rowBody}>
                <Text>Tema do aplicativo</Text>
                <Text color="textSecondary" variant="bodySmall">
                  Escolha como o app aparece neste dispositivo.
                </Text>
              </View>
            </View>
            <SegmentedControl
              label="Tema do aplicativo"
              onChange={(value) => void setPreference(value)}
              options={themeOptions}
              value={preference}
            />
          </Card>
          <Card title="Sessão">
            {error ? <InlineFeedback message={error} variant="error" /> : null}
            <Button
              disabled={isLoading}
              label="Sair da conta"
              loading={isLoading}
              onPress={() => setLogoutConfirmationVisible(true)}
              variant="outline"
            />
          </Card>
          <Card title="Sobre">
            <Text color="textSecondary">
              Tavi {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </Card>
        </View>
      </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  band: {
    alignSelf: 'center',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  body: { flex: 1 },
  content: {
    alignSelf: 'center',
    gap: spacing.md,
    maxWidth: sizes.contentMaxWidth,
    padding: spacing.md,
    width: '100%',
  },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  rowIcon: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  rowBody: { flex: 1, gap: spacing.xs, minWidth: 0 },
});
