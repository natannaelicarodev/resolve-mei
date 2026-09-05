import { render } from '@testing-library/react-native';

import { ClientListScreen } from '@/features/clients/ClientListScreen';
import { useClients } from '@/features/clients/hooks';
import { useReconnectClients } from '@/features/relationships/hooks';
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
  useReconnectClients: jest.fn(),
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

const CLIENTS = [
  { id: 'client-1', name: 'Ana Souza', type: 'individual', status: 'active' },
  { id: 'client-2', name: 'Bruno Lima', type: 'individual', status: 'active' },
];

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(useClients).mockReturnValue({
    data: { pages: [CLIENTS], pageParams: [] },
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isError: false,
    isLoading: false,
    isSuccess: true,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useClients>);
  // Só o primeiro cliente passou do prazo de retorno.
  jest.mocked(useReconnectClients).mockReturnValue({
    data: {
      reconnectAfterDays: 90,
      clients: [{ id: 'client-1', daysSince: 120 }],
    },
  } as unknown as ReturnType<typeof useReconnectClients>);
});

/**
 * A tela "Clientes para retomar" foi fundida a esta lista. O que era uma rota
 * própria virou um filtro, e o dado que a justificava — tempo desde o último
 * atendimento — passou a aparecer em toda linha, no lugar do telefone.
 */
it('shows time since the last service instead of the phone number', async () => {
  const screen = await render(
    <ThemeProvider>
      <ToastProvider>
        <ClientListScreen businessId="business-1" />
      </ToastProvider>
    </ThemeProvider>,
  );

  expect(screen.getByText('Atendido há 4 meses')).toBeTruthy();
  // Sem ordem concluída, a linha diz isso em vez de ficar vazia.
  expect(screen.getByText('Sem atendimento concluído')).toBeTruthy();

  await screen.unmount();
});

// O ponto é redundante com o rótulo acessível: cor sozinha nunca carrega
// estado.
it('marks only the overdue client for attention', async () => {
  const screen = await render(
    <ThemeProvider>
      <ToastProvider>
        <ClientListScreen businessId="business-1" />
      </ToastProvider>
    </ThemeProvider>,
  );

  expect(screen.getByTestId('client-attention-client-1')).toBeTruthy();
  expect(screen.queryByTestId('client-attention-client-2')).toBeNull();
  expect(screen.getByLabelText(/Retomada pendente/)).toBeTruthy();

  await screen.unmount();
});

it('opens already filtered when the Home sends the user here', async () => {
  const screen = await render(
    <ThemeProvider>
      <ToastProvider>
        <ClientListScreen businessId="business-1" initialFilter="reconnect" />
      </ToastProvider>
    </ThemeProvider>,
  );

  // Só o cliente vencido sobra, e o prazo configurado fica à vista com a ação
  // que o altera — era o único conteúdo da tela removida.
  expect(screen.getByText('Ana Souza')).toBeTruthy();
  expect(screen.queryByText('Bruno Lima')).toBeNull();
  expect(screen.getByText('Retomar após 90 dias sem atendimento')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Configurar' })).toBeTruthy();

  await screen.unmount();
});

it('hides the interval control outside the reconnect filter', async () => {
  const screen = await render(
    <ThemeProvider>
      <ToastProvider>
        <ClientListScreen businessId="business-1" />
      </ToastProvider>
    </ThemeProvider>,
  );

  expect(screen.queryByRole('button', { name: 'Configurar' })).toBeNull();

  await screen.unmount();
});
