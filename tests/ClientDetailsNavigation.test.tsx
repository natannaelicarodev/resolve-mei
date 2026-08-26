import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ClientDetailsScreen } from '@/features/clients/ClientDetailsScreen';
import { useClient } from '@/features/clients/hooks';
import { ThemeProvider } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/clients/hooks', () => ({
  clientsQueryKey: (userId: string, businessId: string) => [
    'private',
    userId,
    'clients',
    businessId,
  ],
  useClient: jest.fn(),
}));
jest.mock('@/features/clients/api', () => ({ setClientStatus: jest.fn() }));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(useClient).mockReturnValue({
    data: {
      id: 'client-1',
      business_id: 'business-1',
      type: 'person',
      name: 'Ana Cliente',
      document: null,
      phone: null,
      email: null,
      notes: null,
      status: 'active',
      created_at: '2026-08-26T00:00:00Z',
      updated_at: '2026-08-26T00:00:00Z',
    },
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useClient>);
});

it('returns from client details directly to the clients list', async () => {
  const queryClient = new QueryClient();
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ClientDetailsScreen businessId="business-1" clientId="client-1" />
      </ThemeProvider>
    </QueryClientProvider>,
  );

  fireEvent.press(screen.getByLabelText('Voltar'));

  await waitFor(() =>
    expect(router.dismissTo).toHaveBeenCalledWith('/clients'),
  );
  expect(router.replace).not.toHaveBeenCalledWith('/clients');
  expect(router.replace).not.toHaveBeenCalledWith('/home');
  await screen.unmount();
  queryClient.clear();
});
