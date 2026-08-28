import { useEffect } from 'react';
import { Redirect, Stack, usePathname } from 'expo-router';

import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorFallback } from '@/components/ErrorFallback';
import { decideProtectedRoute } from '@/features/auth/routeGuards';
import { useMyBusiness } from '@/features/business/hooks';
import { logDevelopmentError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme';

export default function ProtectedLayout() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const { isLoading, user } = useAuth();
  const business = useMyBusiness(user?.id);

  useEffect(() => {
    if (business.isError) {
      logDevelopmentError('Business query failed', business.error);
    }
  }, [business.error, business.isError]);

  const decision = decideProtectedRoute({
    authLoading: isLoading,
    hasUser: Boolean(user),
    businessLoading: business.isLoading,
    businessError: business.isError,
    onboardingCompleted: business.data?.onboarding_completed === true,
    pathname,
  });
  if (decision === 'loading')
    return <LoadingScreen label="Preparando seu perfil..." />;
  if (decision === 'sign-in') return <Redirect href="/sign-in" />;
  if (decision === 'error')
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  if (decision === 'onboarding') return <Redirect href="/onboarding" />;
  if (decision === 'home') return <Redirect href="/home" />;

  return (
    <Stack
      key={user?.id}
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="clients" options={{ headerShown: false }} />
      <Stack.Screen name="services" options={{ headerShown: false }} />
      <Stack.Screen name="quotes" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
}
