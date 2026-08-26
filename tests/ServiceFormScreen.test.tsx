import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { createService } from '@/features/services/api';
import { ServiceFormScreen } from '@/features/services/ServiceFormScreen';
import { ThemeProvider } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/services/api', () => ({
  createService: jest.fn(),
  updateService: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

const saved = {
  id: 'service-1',
  business_id: 'business-1',
  name: 'Consultoria',
  description: null,
  price_cents: 15000,
  estimated_duration_minutes: 60,
  status: 'active' as const,
  created_at: '2026-08-26T00:00:00Z',
  updated_at: '2026-08-26T00:00:00Z',
};

async function renderForm(service?: typeof saved) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: 0, retry: false },
      queries: { gcTime: 0, retry: false },
    },
  });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ServiceFormScreen businessId="business-1" service={service} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { invalidate, queryClient, screen };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
});

it('creates once, invalidates cache and navigates after success', async () => {
  jest.mocked(createService).mockResolvedValue(saved);
  const { invalidate, screen } = await renderForm();
  fireEvent.changeText(screen.getByLabelText('Nome do serviço'), 'Consultoria');
  fireEvent.changeText(screen.getByLabelText('Preço'), '15000');
  fireEvent.press(screen.getByRole('button', { name: 'Salvar serviço' }));
  fireEvent.press(screen.getByRole('button', { name: 'Salvar serviço' }));
  await waitFor(() => expect(createService).toHaveBeenCalledTimes(1));
  expect(createService).toHaveBeenCalledWith(
    'business-1',
    expect.objectContaining({ name: 'Consultoria', price: 'R$ 150,00' }),
  );
  expect(await screen.findByText('Serviço salvo com sucesso.')).toBeTruthy();
  expect(invalidate).toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  await waitFor(
    () =>
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/services/[id]',
        params: { id: 'service-1' },
      }),
    { timeout: 1500 },
  );
  await screen.unmount();
});
