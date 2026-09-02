import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';

import { ClientDetailsScreen } from '@/features/clients/ClientDetailsScreen';
import { useClient } from '@/features/clients/hooks';
import { useRelationshipOverview } from '@/features/relationships/hooks';
import { ThemeProvider } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

// A tela usa useQueryClient para a mutação de status.
function renderScreen() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ClientDetailsScreen businessId="business-1" clientId="client-1" />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

jest.mock('@/features/clients/hooks', () => ({
  useClient: jest.fn(),
  clientsQueryKey: () => ['clients'],
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/relationships/hooks', () => ({
  useRelationshipOverview: jest.fn(),
  useRelationshipMutations: jest.fn(() => ({
    profile: { isPending: false, isError: false, mutate: jest.fn() },
    note: { isPending: false, isError: false, mutate: jest.fn() },
    returnInterval: { isPending: false, isError: false, mutate: jest.fn() },
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

const CLIENT = {
  id: 'client-1',
  name: 'Ana Souza',
  type: 'person',
  status: 'active',
  document: '12345678901',
  phone: '11988887777',
  email: 'ana@example.test',
  notes: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(useClient).mockReturnValue({
    data: CLIENT,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useClient>);
  jest.mocked(useRelationshipOverview).mockReturnValue({
    data: {
      profile: {
        recurring: false,
        priority: false,
        expectedReturnDays: null,
        effectiveReturnDays: 90,
        usesBusinessDefault: true,
      },
      lastCompletedAt: '2026-06-04T12:00:00Z',
      daysSince: 90,
      receivedCents: '450000',
      quotes: [],
      orders: [],
    },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useRelationshipOverview>);
});

/**
 * A tela abria com dado de cadastro e terminava com o histórico. Ao abrir um
 * cliente a pergunta é quando foi a última vez e quanto já rendeu — por isso o
 * resumo subiu para o topo, consumindo a mesma consulta que a seção de
 * relacionamento mais abaixo já fazia.
 */
it('leads with elapsed time and total received', async () => {
  const screen = await renderScreen();

  expect(screen.getByText('Último atendimento')).toBeTruthy();
  expect(screen.getByText('Há 3 meses')).toBeTruthy();
  expect(screen.getByText('Recebido')).toBeTruthy();
  expect(screen.getByText('R$ 4.500,00')).toBeTruthy();

  await screen.unmount();
});

it('keeps the cadastral data available below the summary', async () => {
  const screen = await renderScreen();

  // Nada do cadastro desapareceu: o telefone que saiu da linha da lista
  // continua aqui, junto do resto.
  expect(screen.getByText('(11) 98888-7777')).toBeTruthy();
  expect(screen.getByText('ana@example.test')).toBeTruthy();
  expect(screen.getByText('Informações')).toBeTruthy();

  await screen.unmount();
});

it('reads a dash while the relationship data is still loading', async () => {
  jest.mocked(useRelationshipOverview).mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
  } as unknown as ReturnType<typeof useRelationshipOverview>);

  const screen = await renderScreen();

  // O resumo não pode ficar em branco enquanto a consulta chega.
  expect(screen.getAllByText('—')).toHaveLength(2);

  await screen.unmount();
});
