import { decideProtectedRoute } from '@/features/auth/routeGuards';

const base = {
  authLoading: false,
  hasUser: true,
  businessLoading: false,
  businessError: false,
  onboardingCompleted: true,
  pathname: '/home',
};

describe('protected route guard', () => {
  it('blocks unauthenticated users', () => {
    expect(decideProtectedRoute({ ...base, hasUser: false })).toBe('sign-in');
  });
  it('does not render a route while session is loading', () => {
    expect(decideProtectedRoute({ ...base, authLoading: true })).toBe(
      'loading',
    );
  });
  it('redirects incomplete users to onboarding', () => {
    expect(decideProtectedRoute({ ...base, onboardingCompleted: false })).toBe(
      'onboarding',
    );
  });
  it('redirects an authenticated user with a profile and no business', () => {
    const business = null;

    expect(
      decideProtectedRoute({
        ...base,
        hasUser: true,
        businessError: false,
        onboardingCompleted: business !== null,
      }),
    ).toBe('onboarding');
  });
  it('allows incomplete users to stay on onboarding', () => {
    expect(
      decideProtectedRoute({
        ...base,
        onboardingCompleted: false,
        pathname: '/onboarding',
      }),
    ).toBe('render');
  });
  it('sends users with completed onboarding to the authenticated home', () => {
    expect(
      decideProtectedRoute({
        ...base,
        onboardingCompleted: true,
        pathname: '/onboarding',
      }),
    ).toBe('home');
  });
  it('treats a real business query failure as an error', () => {
    expect(decideProtectedRoute({ ...base, businessError: true })).toBe(
      'error',
    );
  });
});
