import { fireEvent, render } from '@testing-library/react-native';

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

const clients = [
  {
    id: 'client-1',
    name: 'Ana Souza',
    type: 'individual',
    status: 'active',
    phone: '11988887777',
    document: null,
    email: null,
  },
  {
    id: 'client-2',
    name: 'Bruno Lima',
    type: 'individual',
    status: 'inactive',
    phone: null,
    document: null,
    email: null,
  },
];

function mockClients(overrides = {}) {
  jest.mocked(useClients).mockReturnValue({
    data: { pages: [clients], pageParams: [] },
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

// A lista virtualiza por cliente: cada linha é um item da FlatList, e o
// agrupamento visual vem das bordas da própria linha. O antigo Card
// envolvendo todos os clientes montava a lista inteira de uma vez.
it('renders one virtualised row per client and paginates on demand', async () => {
  const fetchNextPage = jest.fn();
  mockClients({ fetchNextPage, hasNextPage: true });

  const screen = await render(
    <ThemeProvider>
      <ToastProvider>
        <ClientListScreen businessId="business-1" />
      </ToastProvider>
    </ThemeProvider>,
  );

  expect(screen.getByText('Ana Souza')).toBeTruthy();
  expect(screen.getByText('Bruno Lima')).toBeTruthy();
  // O rótulo carrega o nome mais o tempo desde o último atendimento, porque
  // o subtítulo deixou de ser o telefone.
  expect(screen.getByLabelText(/^Abrir cliente Ana Souza\./)).toBeTruthy();

  fireEvent.press(
    screen.getByRole('button', { name: 'Carregar mais clientes' }),
  );
  expect(fetchNextPage).toHaveBeenCalled();

  await screen.unmount();
});
