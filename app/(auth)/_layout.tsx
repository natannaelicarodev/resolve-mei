import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/providers/AuthProvider';
import { DarkThemeScope, darkColors } from '@/theme';

export default function AuthLayout() {
  const { isLoading, user, isPasswordRecovery } = useAuth();
  if (isLoading) return <LoadingScreen label="Verificando sessão..." />;
  if (user && !isPasswordRecovery) return <Redirect href="/home" />;
  return (
    <DarkThemeScope>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: darkColors.background },
          headerShown: false,
        }}
      />
    </DarkThemeScope>
  );
}
