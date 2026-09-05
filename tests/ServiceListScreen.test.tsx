import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ServiceListScreen } from '@/features/services/ServiceListScreen';
import { useServices } from '@/features/services/hooks';
import { ThemeProvider } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/services/hooks', () => ({ useServices: jest.fn() }));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    AnimatedPressable: Pressable,
    FadeInView: View,
    useReducedMotion: () => true,
  };
});

const service = {
  id: 'service-1',
  business_id: 'business-1',
  name: 'Consultoria',
  description: 'Planejamento',
  price_cents: 15000,
  estimated_duration_minutes: 90,
  status: 'active' as const,
  created_at: '2026-08-26T00:00:00Z',
  updated_at: '2026-08-26T00:00:00Z',
};

function mockQuery(overrides = {}) {
  jest.mocked(useServices).mockReturnValue({
    data: {
      pages: [{ items: [], hasMore: false, nextCursor: null, totalCount: 0 }],
    },
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isLoading: false,
    isSuccess: true,
    refetch: jest.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useServices>);
}

async function renderList() {
  return await render(
    <ThemeProvider>
      <ServiceListScreen businessId="business-1" />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery();
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
});

it('renders unique accumulated pages and opens details', async () => {
  mockQuery({
    data: {
      pages: [
        {
          items: [service],
          hasMore: true,
          nextCursor: { createdAt: service.created_at, id: service.id },
          totalCount: 21,
        },
        { items: [service], hasMore: false, nextCursor: null, totalCount: 21 },
      ],
    },
  });
  const screen = await renderList();
  expect(screen.getAllByText('Consultoria')).toHaveLength(1);
  expect(screen.getByText('21 serviços cadastrados')).toBeTruthy();
  fireEvent.press(screen.getByLabelText(/Consultoria/));
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/services/[id]',
    params: { id: 'service-1' },
  });
  fireEvent.press(screen.getByRole('button', { name: 'Novo serviço' }));
  expect(router.push).toHaveBeenCalledWith('/services/new');
  await screen.unmount();
});
