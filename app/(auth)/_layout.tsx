import { useEffect } from 'react';
import { Redirect, Stack } from 'expo-router';

import { LoadingScreen } from '@/components/LoadingScreen';
import { useBootDestinationReady } from '@/features/boot/BootIntroGate';
import { useAuth } from '@/providers/AuthProvider';

export default function AuthLayout() {
  const { isLoading, user, isPasswordRecovery } = useAuth();
  const markDestinationReady = useBootDestinationReady();
  useEffect(() => {
    if (!isLoading && (!user || isPasswordRecovery)) markDestinationReady();
  }, [isLoading, isPasswordRecovery, markDestinationReady, user]);
  if (isLoading) return <LoadingScreen label="Verificando sessão..." />;
  if (user && !isPasswordRecovery) return <Redirect href="/home" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
