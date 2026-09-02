import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
} from '@testing-library/react-native';

import { setServiceStatus } from '@/features/services/api';
import { ServiceDetailsScreen } from '@/features/services/ServiceDetailsScreen';
import { useService } from '@/features/services/hooks';
import { ThemeProvider } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/services/hooks', () => ({
  servicesQueryKey: (userId: string, businessId: string) => [
    'private',
    userId,
    'services',
    businessId,
  ],
  useService: jest.fn(),
}));
jest.mock('@/features/services/api', () => ({ setServiceStatus: jest.fn() }));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

const service = {
  id: 'service-1',
  business_id: 'business-1',
  name: 'Consultoria',
  description: 'Planejamento completo',
  price_cents: 15000,
  estimated_duration_minutes: 90,
  status: 'active' as const,
  created_at: '2026-08-26T00:00:00Z',
  updated_at: '2026-08-26T00:00:00Z',
};

async function renderDetails() {
  const client = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: 0, retry: false },
      queries: { gcTime: 0, retry: false },
    },
  });
  return await render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <ServiceDetailsScreen businessId="business-1" serviceId="service-1" />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(useService).mockReturnValue({
    data: service,
    isError: false,
    isLoading: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useService>);
});

afterEach(async () => {
  await cleanup();
});

it('shows real details without empty placeholders', async () => {
  const screen = await renderDetails();
  expect(screen.getByText('Consultoria')).toBeTruthy();
  expect(screen.getByText('R$ 150,00')).toBeTruthy();
  // A duração subiu para o resumo do topo, junto do preço, e ali carrega o
  // próprio rótulo em vez de depender de um par rótulo/valor separado.
  expect(screen.getByText('Duração estimada: 1 h 30 min')).toBeTruthy();
  expect(screen.getByText('Planejamento completo')).toBeTruthy();
});

it('confirms and inactivates the existing service', async () => {
  jest.mocked(setServiceStatus).mockResolvedValue({
    ...service,
    status: 'inactive',
  });
  const screen = await renderDetails();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Inativar serviço' }),
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Inativar' }),
  );
  await waitFor(() =>
    expect(setServiceStatus).toHaveBeenCalledWith(
      'business-1',
      'service-1',
      'inactive',
    ),
  );
});

it('distinguishes not found from a query error', async () => {
  jest.mocked(useService).mockReturnValue({
    data: null,
    isError: false,
    isLoading: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useService>);
  const missing = await renderDetails();
  expect(missing.getByText('Este serviço não foi encontrado.')).toBeTruthy();
  await missing.unmount();
  jest.mocked(useService).mockReturnValue({
    data: undefined,
    isError: true,
    isLoading: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useService>);
  const error = await renderDetails();
  expect(
    error.getByText('Não foi possível carregar este serviço.'),
  ).toBeTruthy();
});
