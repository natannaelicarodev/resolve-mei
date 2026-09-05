import { render } from '@testing-library/react-native';

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

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useClients).mockReturnValue({
    data: { pages: [[]], pageParams: [] },
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isError: false,
    isLoading: false,
    isSuccess: true,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useClients>);
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
});

// Sem clientes, a FlatList mostra o estado vazio padrão e nenhuma ação de
// paginação — o botão "Carregar mais" pertence ao rodapé da lista populada.
it('shows the shared empty state without the pagination action', async () => {
  const screen = await render(
    <ThemeProvider>
      <ToastProvider>
        <ClientListScreen businessId="business-1" />
      </ToastProvider>
    </ThemeProvider>,
  );

  expect(screen.getByText('Nenhum cliente cadastrado')).toBeTruthy();
  expect(
    screen.queryByRole('button', { name: 'Carregar mais clientes' }),
  ).toBeNull();

  await screen.unmount();
});
