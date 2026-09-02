import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { QuoteListScreen } from '@/features/quotes/QuoteListScreen';
import { useQuotes } from '@/features/quotes/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { ThemeProvider } from '@/theme';

jest.mock('@/features/quotes/hooks', () => ({ useQuotes: jest.fn() }));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    AnimatedPressable: Pressable,
    FadeInView: View,
    useReducedMotion: () => true,
  };
});

const quote = {
  id: 'quote-1',
  business_id: 'business-1',
  client_id: 'client-1',
  quote_number: 42,
  status: 'approved' as const,
  issued_on: '2026-08-26',
  valid_until: '2026-09-26',
  subtotal_cents: 125000000,
  discount_cents: 0,
  total_cents: 125000000,
  notes: null,
  client_name_snapshot:
    'Cliente com um nome profissional muito longo para a largura do aparelho',
  client_document_snapshot: null,
  client_phone_snapshot: null,
  client_email_snapshot: null,
  created_at: '2026-08-26T18:00:00Z',
  updated_at: '2026-08-26T18:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(useQuotes).mockReturnValue({
    data: {
      pages: [
        { items: [quote], hasMore: false, nextCursor: null, totalCount: 1 },
      ],
    },
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isLoading: false,
    isRefetching: false,
    isSuccess: true,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useQuotes>);
});

it('renders accessible single-line filters and a compact quote card', async () => {
  const screen = await render(
    <ThemeProvider>
      <QuoteListScreen businessId="business-1" />
    </ThemeProvider>,
  );

  expect(screen.getAllByText('Orçamentos').length).toBeGreaterThan(0);
  expect(screen.queryByText('Seus orçamentos')).toBeNull();
  expect(screen.getByText('1 encontrado')).toBeTruthy();
  expect(screen.queryByText('quotes')).toBeNull();
  for (const label of ['Todos', 'Rascunhos', 'Enviados', 'Aprovados']) {
    const chip = screen.getByRole('radio', { name: label });
    expect(chip).toBeTruthy();
    expect(screen.getByText(label).props.numberOfLines).toBe(1);
  }
  expect(
    screen.getByRole('radio', { name: 'Todos' }).props.accessibilityState,
  ).toMatchObject({ checked: true, selected: true });
  expect(screen.getByText('R$ 1.250.000,00')).toBeTruthy();
  // A linha de tempo substitui "emissão · validade": num orçamento já
  // decidido, o selo ao lado anuncia o desfecho, então ela mostra a emissão.
  expect(screen.getByText('Emitido em 26/08/2026')).toBeTruthy();
  expect(screen.getByText('Aprovado')).toBeTruthy();

  const quoteCard = screen.getByRole('button', {
    name: /000042, Cliente com um nome profissional muito longo.*Aprovado.*Emitido em 26\/08\/2026.*1\.250\.000,00/,
  });
  expect(quoteCard).toBeTruthy();
  fireEvent.press(quoteCard);
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/quotes/[id]',
    params: { id: 'quote-1' },
  });
  fireEvent.press(screen.getByRole('radio', { name: 'Rascunhos' }));
  expect(screen.getByRole('button', { name: 'Novo orçamento' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Novo orçamento' }));
  expect(router.push).toHaveBeenCalledWith('/quotes/new');
  await screen.unmount();
});
