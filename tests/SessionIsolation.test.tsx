import type { Session } from '@supabase/supabase-js';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';

import { Text } from '@/components/ui';
import { profileQueryKey } from '@/features/profile/api';
import { supabase } from '@/lib/supabase';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';

let mockAuthCallback:
  ((event: string, session: Session | null) => void) | undefined;
const mockUnsubscribe = jest.fn();

jest.mock('@/features/auth/api', () => ({ signOut: jest.fn() }));
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn((callback: typeof mockAuthCallback) => {
        mockAuthCallback = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      }),
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));

const sessions = {
  a: { user: { id: 'user-a' } } as unknown as Session,
  b: { user: { id: 'user-b' } } as unknown as Session,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function PrivateProfile({ loadB }: { loadB: Promise<string> }) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const query = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => (userId === 'user-a' ? Promise.resolve('Ana') : loadB),
    enabled: Boolean(userId),
  });
  return <Text>{query.data ?? 'sem dados privados'}</Text>;
}

it('never renders account A while account B is loading', async () => {
  const profileB = deferred<string>();
  jest.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: sessions.a },
    error: null,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  });
  const cancelQueries = jest.spyOn(queryClient, 'cancelQueries');
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PrivateProfile loadB={profileB.promise} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  expect(await screen.findByText('Ana')).toBeTruthy();

  await act(() => mockAuthCallback?.('SIGNED_IN', sessions.b));
  await waitFor(() => expect(screen.queryByText('Ana')).toBeNull());
  expect(screen.getByText('sem dados privados')).toBeTruthy();
  expect(queryClient.getQueryData(profileQueryKey('user-a'))).toBeUndefined();
  expect(cancelQueries).toHaveBeenCalled();

  await act(() => profileB.resolve('Bruna'));
  expect(await screen.findByText('Bruna')).toBeTruthy();

  await act(() => mockAuthCallback?.('SIGNED_IN', sessions.a));
  await waitFor(() => expect(screen.queryByText('Bruna')).toBeNull());
  expect(await screen.findByText('Ana')).toBeTruthy();

  await act(() => mockAuthCallback?.('SIGNED_OUT', null));
  await waitFor(() => expect(screen.queryByText('Ana')).toBeNull());
  expect(screen.getByText('sem dados privados')).toBeTruthy();
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  await screen.unmount();
  queryClient.clear();
});

it('does not clear private cache on token refresh for the same user', async () => {
  jest.mocked(supabase.auth.getSession).mockResolvedValue({
    data: { session: sessions.a },
    error: null,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  });
  const clear = jest.spyOn(queryClient, 'clear');
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PrivateProfile loadB={Promise.resolve('Bruna')} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  expect(await screen.findByText('Ana')).toBeTruthy();
  clear.mockClear();
  await act(() => mockAuthCallback?.('TOKEN_REFRESHED', sessions.a));
  expect(screen.getByText('Ana')).toBeTruthy();
  expect(clear).not.toHaveBeenCalled();
  await screen.unmount();
  queryClient.clear();
});
