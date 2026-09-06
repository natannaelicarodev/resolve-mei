import { render } from '@testing-library/react-native';

import HomeRoute from '@app/(protected)/home';

const receivedProps: Record<string, unknown>[] = [];

jest.mock('@/features/daylight/DaylightHomeScreen', () => ({
  DaylightHomeScreen: (props: Record<string, unknown>) => {
    receivedProps.push(props);
    return null;
  },
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({ data: { full_name: 'Ana Silva' } })),
  useQueryClient: jest.fn(() => ({
    getQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  })),
  useMutation: jest.fn(() => ({ isPending: false, mutate: jest.fn() })),
}));
jest.mock('@/providers/AuthProvider', () => ({
  useAuth: jest.fn(() => ({ user: { id: 'user-1' } })),
}));
jest.mock('@/features/business/hooks', () => ({
  businessQueryKey: (userId: string) => ['private', userId, 'business'],
  useMyBusiness: jest.fn(() => ({
    data: { id: 'business-1', business_name: 'Oficina Aurora' },
    isLoading: false,
  })),
}));
jest.mock('@/features/clients/hooks', () => ({
  useActiveClientCount: jest.fn(() => ({ data: 1 })),
}));
jest.mock('@/features/services/hooks', () => ({
  useServices: jest.fn(() => ({ data: { pages: [{ totalCount: 1 }] } })),
}));
jest.mock('@/features/profile/avatar', () => ({
  createAvatarSignedUrl: jest.fn(),
}));
jest.mock('@/features/profile/api', () => ({
  getMyProfile: jest.fn(),
  profileQueryKey: jest.fn(() => ['profile']),
}));

const mockQuote = {
  client_name_snapshot: 'Cliente',
  id: 'quote-1',
  quote_number: 1,
  status: 'draft',
  updated_at: '2026-09-01T12:00:00Z',
};
const mockOtherQuote = { ...mockQuote, id: 'quote-2', quote_number: 2 };
const mockDraftData = { pages: [{ items: [mockQuote], totalCount: 1 }] };
const mockSentData = { pages: [{ items: [], totalCount: 0 }] };
const mockRecentData = {
  pages: [{ items: [mockQuote, mockOtherQuote], totalCount: 2 }],
};

jest.mock('@/features/quotes/hooks', () => ({
  useQuotes: jest.fn(
    (_userId: string, _businessId: string, _search: string, status: string) =>
      status === 'draft'
        ? { data: mockDraftData }
        : status === 'sent'
          ? { data: mockSentData }
          : {
              data: mockRecentData,
              isLoading: false,
            },
  ),
}));
jest.mock('@/features/agenda/hooks', () => ({
  useAgendaOverview: jest.fn(() => ({ isLoading: false })),
}));
jest.mock('@/features/relationships/hooks', () => ({
  useReconnectClients: jest.fn(() => ({ isLoading: false })),
}));

it('measures derived Home prop identities across a stable route rerender', async () => {
  receivedProps.length = 0;
  const screen = await render(<HomeRoute />);
  await screen.rerender(<HomeRoute />);

  expect(receivedProps).toHaveLength(2);
  expect(receivedProps[0]?.highlightQuote).toBe(
    receivedProps[1]?.highlightQuote,
  );
  expect(receivedProps[0]?.recentQuotes).toBe(receivedProps[1]?.recentQuotes);
});
