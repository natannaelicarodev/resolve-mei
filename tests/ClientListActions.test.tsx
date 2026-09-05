import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ClientListScreen } from '@/features/clients/ClientListScreen';
import { useClients } from '@/features/clients/hooks';
import { ToastProvider } from '@/components/ui';
import { ThemeProvider } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/clients/hooks', () => ({
  useClients: jest.fn(),
  useClientMutations: jest.fn(() => ({
    archive: { isPending: false, mutate: jest.fn() },
    activate: { isPending: false, mutate: jest.fn() },
  })),
  usePrefetchClientStatuses: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/relationships/hooks', () => ({
  useReconnectClients: jest.fn(() => ({ data: undefined })),
  useRelationshipMutations: jest.fn(() => ({
    settings: { isPending: false, mutate: jest.fn() },
  })),
}));

jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    AnimatedPressable: Pressable,
    FadeInView: View,
    useReducedMotion: () => true,
  };
});

function mockClients(overrides = {}) {
  jest.mocked(useClients).mockReturnValue({
    data: { pages: [], pageParams: [] },
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isError: false,
    isLoading: false,
    isSuccess: true,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useClients>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockClients();
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
});

it('shows an explicit add-client action and opens the creation form', async () => {
  const screen = await render(
    <ThemeProvider>
      <ToastProvider>
        <ClientListScreen businessId="business-1" />
      </ToastProvider>
    </ThemeProvider>,
  );

  const action = screen.getByRole('button', { name: 'Novo cliente' });
  expect(action.props.accessibilityHint).toBe(
    'Abre o formulário para adicionar um cliente.',
  );
  fireEvent.press(action);
  expect(router.push).toHaveBeenCalledWith('/clients/new');
  expect(screen.getByText('Todos')).toBeTruthy();
  expect(screen.queryByText(/✓/)).toBeNull();

  await screen.unmount();
});
