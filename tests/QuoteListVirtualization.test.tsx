import { render } from '@testing-library/react-native';

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

const base = {
  business_id: 'business-1',
  client_id: 'client-1',
  status: 'approved' as const,
  issued_on: '2026-08-26',
  valid_until: '2026-09-26',
  subtotal_cents: 125000000,
  discount_cents: 0,
  total_cents: 125000000,
  notes: null,
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
        {
          items: [
            {
              ...base,
              id: 'quote-1',
              quote_number: 42,
              client_name_snapshot: 'Primeiro cliente',
            },
            {
              ...base,
              id: 'quote-2',
              quote_number: 43,
              client_name_snapshot: 'Segundo cliente',
            },
          ],
          hasMore: false,
          nextCursor: null,
          totalCount: 2,
        },
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

// Cada orçamento é um item próprio da FlatList, então a lista pode descartar
// linhas fora da janela de renderização. A estrutura anterior passava um único
// item contendo todos os orçamentos, o que anulava a virtualização.
it('renders every quote as its own virtualised row', async () => {
  const screen = await render(
    <ThemeProvider>
      <QuoteListScreen businessId="business-1" />
    </ThemeProvider>,
  );

  expect(
    screen.getByRole('button', { name: /^000042, Primeiro cliente/ }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: /^000043, Segundo cliente/ }),
  ).toBeTruthy();
  expect(screen.getByText('2 encontrados')).toBeTruthy();

  await screen.unmount();
});
