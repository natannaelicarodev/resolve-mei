import React from 'react';
import { render } from '@testing-library/react-native';

import ProtectedLayout from '@app/(protected)/_layout';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { useMyBusiness } from '@/features/business/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'expo-router';

jest.mock('@/features/business/hooks', () => ({
  useMyBusiness: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

// Counts fresh mounts of the Stack subtree. React only re-runs a useState
// initializer when the subtree is unmounted and mounted again -- exactly what a
// changed key={user?.id} forces when the signed-in identity switches.
const mockProbe = { mounts: 0 };

// Renders the Stack element the layout actually returns -- preserving its key --
// and mounts a stateful probe inside it so a remount is observable as state loss.
jest.mock('expo-router', () => {
  const react = jest.requireActual<typeof import('react')>('react');
  const rn = jest.requireActual<typeof import('react-native')>('react-native');
  function SessionProbe() {
    const [mountId] = react.useState(() => ++mockProbe.mounts);
    return react.createElement(rn.Text, null, `probe-mount-${mountId}`);
  }
  function MockStack({ children }: { children?: React.ReactNode }) {
    return react.createElement(
      rn.View,
      null,
      react.createElement(SessionProbe),
      children,
    );
  }
  MockStack.Screen = function MockScreen() {
    return null;
  };
  return {
    router: {
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
      dismissTo: jest.fn(),
      push: jest.fn(),
      replace: jest.fn(),
    },
    Link: 'Link',
    Redirect: 'Redirect',
    Stack: MockStack,
    useLocalSearchParams: jest.fn(() => ({})),
    usePathname: jest.fn(),
  };
});

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => undefined);

function signedInAs(id: string) {
  jest.mocked(useAuth).mockReturnValue({
    isLoading: false,
    user: { id },
  } as ReturnType<typeof useAuth>);
}

describe('ProtectedLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProbe.mounts = 0;
    signedInAs('user-1');
    jest.mocked(useMyBusiness).mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyBusiness>);
  });

  afterAll(() => consoleError.mockRestore());

  it('redirects an authenticated user without a business to onboarding without triggering the boundary', async () => {
    jest.mocked(usePathname).mockReturnValue('/home');

    const screen = await render(
      <AppErrorBoundary>
        <ProtectedLayout />
      </AppErrorBoundary>,
    );

    expect(screen.toJSON()).toMatchObject({
      type: 'Redirect',
      props: { href: '/onboarding' },
    });
    expect(screen.queryByText('Algo deu errado')).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('redirects a user with completed onboarding to the authenticated home', async () => {
    jest.mocked(usePathname).mockReturnValue('/onboarding');
    jest.mocked(useMyBusiness).mockReturnValue({
      data: { onboarding_completed: true },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyBusiness>);

    const screen = await render(<ProtectedLayout />);

    expect(screen.toJSON()).toMatchObject({
      type: 'Redirect',
      props: { href: '/home' },
    });
  });

  describe('session isolation of the protected stack', () => {
    beforeEach(() => {
      // Force decision === 'render' so the Stack itself is rendered.
      jest.mocked(usePathname).mockReturnValue('/home');
      jest.mocked(useMyBusiness).mockReturnValue({
        data: { onboarding_completed: true },
        error: null,
        isError: false,
        isLoading: false,
        refetch: jest.fn(),
      } as unknown as ReturnType<typeof useMyBusiness>);
    });

    it('renders the protected stack instead of redirecting', async () => {
      const screen = await render(<ProtectedLayout />);

      expect(screen.getByText('probe-mount-1')).toBeTruthy();
    });

    it('keeps stack state across re-renders for the same user', async () => {
      const screen = await render(<ProtectedLayout />);
      expect(screen.getByText('probe-mount-1')).toBeTruthy();

      await screen.rerender(<ProtectedLayout />);

      // No remount: the subtree kept its identity, so state survived.
      expect(screen.getByText('probe-mount-1')).toBeTruthy();
      expect(mockProbe.mounts).toBe(1);
    });

    it('remounts the protected stack when the signed-in user changes', async () => {
      const screen = await render(<ProtectedLayout />);
      expect(screen.getByText('probe-mount-1')).toBeTruthy();

      signedInAs('user-2');
      await screen.rerender(<ProtectedLayout />);

      // A different key discards the old subtree, so no state from the
      // previous account can survive into the next session.
      expect(screen.queryByText('probe-mount-1')).toBeNull();
      expect(screen.getByText('probe-mount-2')).toBeTruthy();
      expect(mockProbe.mounts).toBe(2);
    });
  });
});
