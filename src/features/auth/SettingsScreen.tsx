import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
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
import { radii, spacing, useTheme } from '@/theme';

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
  const logout = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(undefined);
    try {
      await signOut();
      router.replace('/sign-in');
      void triggerHaptic('selection');
    } catch (caught) {
      setError(normalizeError(caught).message);
      setIsLoading(false);
    }
  };
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Screen contentContainerStyle={styles.screenContent} safeAreaEdges={[]}>
        <ProtectedPageHeader back title="Configurações" />
        <View style={styles.section}>
          <Text color="primary" style={styles.sectionTitle} variant="caption">
            CONTA
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text color="textMuted" variant="caption">
              E-mail
            </Text>
            <Text variant="label">{user?.email}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text color="primary" style={styles.sectionTitle} variant="caption">
            APARÊNCIA
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text color="textSecondary" variant="caption">
              Escolha como o ResolveMEI aparece neste dispositivo.
            </Text>
            <SegmentedControl
              label="Tema do aplicativo"
              onChange={(value) => void setPreference(value)}
              options={themeOptions}
              value={preference}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text color="primary" style={styles.sectionTitle} variant="caption">
            SESSÃO
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text color="textSecondary" variant="caption">
              Encerre o acesso neste dispositivo.
            </Text>
            {error ? <InlineFeedback message={error} variant="error" /> : null}
            <Button
              disabled={isLoading}
              label="Sair da conta"
              loading={isLoading}
              onPress={() => setConfirmingLogout(true)}
              variant="danger"
            />
            <ConfirmationDialog
              confirmLabel="Sair da conta"
              description="Você precisará entrar novamente para acessar seus dados."
              destructive
              loading={isLoading}
              onCancel={() => setConfirmingLogout(false)}
              onConfirm={() => {
                setConfirmingLogout(false);
                void logout();
              }}
              title="Sair da conta?"
              visible={confirmingLogout}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text color="primary" style={styles.sectionTitle} variant="caption">
            SOBRE
          </Text>
          <View
            style={[
              styles.aboutRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text variant="label">
              ResolveMEI {Constants.expoConfig?.version ?? '1.0.0'}
            </Text>
          </View>
        </View>
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 14,
  },
  card: {
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.md,
  },
  aboutRow: {
    alignItems: 'center',
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
});
