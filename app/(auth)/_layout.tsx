import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthLayout() {
  const { isLoading, user, isPasswordRecovery } = useAuth();
  if (isLoading) return <LoadingScreen label="Verificando sessão..." />;
  if (user && !isPasswordRecovery) return <Redirect href="/home" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
