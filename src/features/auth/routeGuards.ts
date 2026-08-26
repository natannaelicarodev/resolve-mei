export type ProtectedRouteDecision =
  'loading' | 'sign-in' | 'onboarding' | 'home' | 'render' | 'error';

export function decideProtectedRoute(input: {
  authLoading: boolean;
  hasUser: boolean;
  businessLoading: boolean;
  businessError: boolean;
  onboardingCompleted: boolean;
  pathname: string;
}): ProtectedRouteDecision {
  if (input.authLoading || (input.hasUser && input.businessLoading))
    return 'loading';
  if (!input.hasUser) return 'sign-in';
  if (input.businessError) return 'error';
  if (!input.onboardingCompleted && input.pathname !== '/onboarding')
    return 'onboarding';
  if (input.onboardingCompleted && input.pathname === '/onboarding')
    return 'home';
  return 'render';
}
