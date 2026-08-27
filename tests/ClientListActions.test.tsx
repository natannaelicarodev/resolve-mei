import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ClientListScreen } from '@/features/clients/ClientListScreen';
import { useClients } from '@/features/clients/hooks';
import { ThemeProvider } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/clients/hooks', () => ({ useClients: jest.fn() }));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useClients).mockReturnValue({
    data: [],
    isError: false,
    isLoading: false,
    isSuccess: true,
  } as unknown as ReturnType<typeof useClients>);
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
});

function mockClients(overrides: Partial<ReturnType<typeof useClients>> = {}) {
  jest.mocked(useClients).mockReturnValue({
    data: [],
    isError: false,
    isLoading: false,
    isSuccess: true,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useClients>);
}

const client = (id: string, name: string) => ({
  id,
  name,
  status: 'active',
  type: 'individual',
  phone: null,
  document: null,
  email: null,
});

it('renders every client row returned by the query', async () => {
  mockClients({
    data: [client('c-1', 'Ana Souza'), client('c-2', 'Bruno Lima')],
  } as Partial<ReturnType<typeof useClients>>);

  const screen = await render(
    <ThemeProvider>
      <ClientListScreen businessId="business-1" />
    </ThemeProvider>,
  );

  expect(screen.getByText('Ana Souza')).toBeTruthy();
  expect(screen.getByText('Bruno Lima')).toBeTruthy();
  await screen.unmount();
});

it('opens a client from its row', async () => {
  mockClients({
    data: [client('c-1', 'Ana Souza')],
  } as Partial<ReturnType<typeof useClients>>);

  const screen = await render(
    <ThemeProvider>
      <ClientListScreen businessId="business-1" />
    </ThemeProvider>,
  );

  await fireEvent.press(
    screen.getByRole('button', { name: 'Abrir cliente Ana Souza' }),
  );

  expect(router.push).toHaveBeenCalledWith({
    pathname: '/clients/[id]',
    params: { id: 'c-1' },
  });
  await screen.unmount();
});

it('shows the empty state and keeps the search controls reachable', async () => {
  mockClients();

  const screen = await render(
    <ThemeProvider>
      <ClientListScreen businessId="business-1" />
    </ThemeProvider>,
  );

  expect(screen.getByText('Nenhum cliente cadastrado')).toBeTruthy();
  // The header must stay mounted alongside the empty state.
  expect(screen.getByText('Seus clientes')).toBeTruthy();
  await screen.unmount();
});

it('surfaces a retry action when the query fails', async () => {
  const refetch = jest.fn();
  mockClients({
    data: undefined,
    isError: true,
    isSuccess: false,
    refetch,
  } as Partial<ReturnType<typeof useClients>>);

  const screen = await render(
    <ThemeProvider>
      <ClientListScreen businessId="business-1" />
    </ThemeProvider>,
  );

  expect(
    screen.getByText('Não foi possível carregar os clientes.'),
  ).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Tentar novamente' }),
  );
  expect(refetch).toHaveBeenCalledTimes(1);
  await screen.unmount();
});

it('announces the loading state while clients are fetched', async () => {
  mockClients({
    data: undefined,
    isLoading: true,
    isSuccess: false,
  } as Partial<ReturnType<typeof useClients>>);

  const screen = await render(
    <ThemeProvider>
      <ClientListScreen businessId="business-1" />
    </ThemeProvider>,
  );

  expect(screen.getByLabelText('Carregando clientes')).toBeTruthy();
  await screen.unmount();
});

it('shows an explicit add-client action and opens the creation form', async () => {
  const screen = await render(
    <ThemeProvider>
      <ClientListScreen businessId="business-1" />
    </ThemeProvider>,
  );

  const action = screen.getByRole('button', { name: 'Novo cliente' });
  expect(action.props.accessibilityHint).toBe(
    'Abre o formulário para adicionar um cliente.',
  );
  await fireEvent.press(action);
  expect(router.push).toHaveBeenCalledWith('/clients/new');
  expect(screen.getByText('Todos')).toBeTruthy();
  expect(screen.queryByText(/✓/)).toBeNull();

  await screen.unmount();
});
