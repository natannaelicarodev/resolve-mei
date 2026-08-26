import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';

import { Text } from '@/components/ui';
import { useAuth, AuthProvider } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

const mockUnsubscribe = jest.fn();
let mockAuthCallback:
  ((event: 'SIGNED_OUT', session: Session | null) => void) | undefined;

jest.mock('@/features/auth/api', () => ({ signOut: jest.fn() }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(
        (callback: (event: 'SIGNED_OUT', session: Session | null) => void) => {
          mockAuthCallback = callback;
          return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
        },
      ),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));

function SessionStatus() {
  const { isLoading, user } = useAuth();
  return <Text>{isLoading ? 'loading' : (user?.id ?? 'signed-out')}</Text>;
}

describe('AuthProvider', () => {
  const renderProvider = async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: 0, retry: false } },
    });
    const screen = await render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SessionStatus />
        </AuthProvider>
      </QueryClientProvider>,
    );
    return { queryClient, screen };
  };

  it('loads a persisted session and reacts to sign-out', async () => {
    const session = { user: { id: 'user-1' } } as unknown as Session;
    jest
      .mocked(supabase.auth.getSession)
      .mockResolvedValue({ data: { session }, error: null });
    const { screen } = await renderProvider();
    await waitFor(() => expect(screen.getByText('user-1')).toBeTruthy());
    await act(() => {
      mockAuthCallback?.('SIGNED_OUT', null);
    });
    await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
  });

  it('disposes the auth listener', async () => {
    jest
      .mocked(supabase.auth.getSession)
      .mockResolvedValue({ data: { session: null }, error: null });
    const { screen } = await renderProvider();
    await screen.unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
