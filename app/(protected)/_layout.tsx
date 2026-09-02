import { memo, useEffect } from 'react';
import { Redirect, Stack, usePathname } from 'expo-router';

import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorFallback } from '@/components/ErrorFallback';
import { decideProtectedRoute } from '@/features/auth/routeGuards';
import { useMyBusiness } from '@/features/business/hooks';
import { logDevelopmentError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme';
import { markRender } from '@/lib/renderDiagnostics';

export default function ProtectedLayout() {
  markRender('ProtectedLayout');
  const { colors } = useTheme();
  const { isLoading, user } = useAuth();
  const business = useMyBusiness(user?.id);

  useEffect(() => {
    if (business.isError) {
      logDevelopmentError('Business query failed', business.error);
    }
  }, [business.error, business.isError]);

  return (
    <ProtectedRouteGate
      authLoading={isLoading}
      backgroundColor={colors.background}
      businessError={business.isError}
      businessLoading={business.isLoading}
      hasUser={Boolean(user)}
      onboardingCompleted={business.data?.onboarding_completed === true}
      onRetry={() => void business.refetch()}
      userId={user?.id}
    />
  );
}

function ProtectedRouteGate({
  authLoading,
  backgroundColor,
  businessError,
  businessLoading,
  hasUser,
  onboardingCompleted,
  onRetry,
  userId,
}: {
  authLoading: boolean;
  backgroundColor: string;
  businessError: boolean;
  businessLoading: boolean;
  hasUser: boolean;
  onboardingCompleted: boolean;
  onRetry: () => void;
  userId?: string;
}) {
  const pathname = usePathname();
  const decision = decideProtectedRoute({
    authLoading,
    hasUser,
    businessLoading,
    businessError,
    onboardingCompleted,
    pathname,
  });
  if (decision === 'loading')
    return <LoadingScreen label="Preparando seu perfil..." />;
  if (decision === 'sign-in') return <Redirect href="/sign-in" />;
  if (decision === 'error') return <ErrorFallback onRetry={onRetry} />;
  if (decision === 'onboarding') return <Redirect href="/onboarding" />;
  if (decision === 'home') return <Redirect href="/home" />;

  return <ProtectedStack backgroundColor={backgroundColor} userId={userId} />;
}

const ProtectedStack = memo(function ProtectedStack({
  backgroundColor,
  userId,
}: {
  backgroundColor: string;
  userId?: string;
}) {
  markRender('ProtectedStack');
  return (
    <Stack
      key={userId}
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="clients" options={{ headerShown: false }} />
      <Stack.Screen name="services" options={{ headerShown: false }} />
      <Stack.Screen name="quotes" options={{ headerShown: false }} />
      <Stack.Screen name="service-orders" options={{ headerShown: false }} />
      <Stack.Screen name="agenda" options={{ headerShown: false }} />
      <Stack.Screen name="expenses" options={{ headerShown: false }} />
      <Stack.Screen name="result" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{ title: 'Perfil profissional', headerBackVisible: false }}
      />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
    </Stack>
  );
});
