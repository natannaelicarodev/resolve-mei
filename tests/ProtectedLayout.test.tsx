import { render } from '@testing-library/react-native';

import ProtectedLayout from '@app/(protected)/_layout';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { useMyBusiness } from '@/features/business/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'expo-router';
import {
  getRenderDiagnostic,
  resetRenderDiagnostics,
} from '@/lib/renderDiagnostics';

jest.mock('@/features/business/hooks', () => ({
  useMyBusiness: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

let mockStackMountCounter = 0;

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    dismissTo: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  Link: 'Link',
  Redirect: 'Redirect',
  // Stack.Screen entries carry no state worth observing; the real signal is
  // whether <Stack key={user?.id}> itself gets a fresh mount. A stateful
  // lazy initializer only re-runs on an actual mount (never on a props-only
  // update), so its rendered value is a reliable, black-box proxy for "did
  // key={user?.id} force React to discard the previous instance".
  Stack: Object.assign(
    function MockStack() {
      // jest.mock factories run before module-level imports are hoisted, so
      // these must be required lazily here rather than imported at the top.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { useState } = require('react');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Text } = require('react-native');
      const [mountId] = useState(() => ++mockStackMountCounter);
      return <Text testID="stack-mount-id">{mountId}</Text>;
    },
    { Screen: 'Screen' },
  ),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(),
}));

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => undefined);

describe('ProtectedLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRenderDiagnostics();
    mockStackMountCounter = 0;
    jest.mocked(useAuth).mockReturnValue({
      isLoading: false,
      user: { id: 'user-1' },
    } as ReturnType<typeof useAuth>);
    jest.mocked(useMyBusiness).mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyBusiness>);
  });

  afterAll(() => consoleError.mockRestore());

  it('records the protected Stack work repeated by a pathname update', async () => {
    jest.mocked(usePathname).mockReturnValue('/home');
    jest.mocked(useMyBusiness).mockReturnValue({
      data: { onboarding_completed: true },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyBusiness>);

    const screen = await render(<ProtectedLayout />);
    jest.mocked(usePathname).mockReturnValue('/clients');
    await screen.rerender(<ProtectedLayout />);

    expect(getRenderDiagnostic('ProtectedLayout')).toBe(2);
    expect(getRenderDiagnostic('ProtectedStack')).toBe(1);
  });

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

  it('forces a fresh Stack instance on every account switch (A -> B -> A), never reusing a prior user’s render tree', async () => {
    // ProtectedNavigation/_layout já causou um vazamento crítico de sessão no
    // passado: dados de uma conta apareciam após a troca de usuário. O Stack
    // usa key={user?.id} propositalmente para forçar remontagem completa a
    // cada troca de conta. React nunca expõe `key` como prop observável, então
    // este teste prova o contrato por um sinal comportamental equivalente: um
    // useState com inicializador preguiçoso só reexecuta numa remontagem real,
    // nunca numa atualização de props do mesmo fiber.
    jest.mocked(usePathname).mockReturnValue('/home');
    jest.mocked(useMyBusiness).mockReturnValue({
      data: { onboarding_completed: true },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyBusiness>);

    const asUser = (id: string) =>
      ({ isLoading: false, user: { id } }) as ReturnType<typeof useAuth>;

    jest.mocked(useAuth).mockReturnValue(asUser('user-a'));
    const screen = await render(<ProtectedLayout />);
    const firstAId = screen.getByTestId('stack-mount-id').props.children;

    // Re-render with the SAME user: mount id must be preserved (sanity check
    // that this isn't a false positive from remounting on every render).
    await screen.rerender(<ProtectedLayout />);
    expect(screen.getByTestId('stack-mount-id').props.children).toBe(firstAId);

    // A -> B: must remount (fresh mount id).
    jest.mocked(useAuth).mockReturnValue(asUser('user-b'));
    await screen.rerender(<ProtectedLayout />);
    const bId = screen.getByTestId('stack-mount-id').props.children;
    expect(bId).not.toBe(firstAId);

    // B -> A: must remount again, not reuse the original A instance either.
    jest.mocked(useAuth).mockReturnValue(asUser('user-a'));
    await screen.rerender(<ProtectedLayout />);
    const backToAId = screen.getByTestId('stack-mount-id').props.children;
    expect(backToAId).not.toBe(bId);
    expect(backToAId).not.toBe(firstAId);
  });
});
