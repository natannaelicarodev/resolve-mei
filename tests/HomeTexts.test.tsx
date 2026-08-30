import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import HomeRoute from '@app/(protected)/home';
import { useMyBusiness } from '@/features/business/hooks';
import { useHomeDashboard } from '@/features/home/hooks';
import { useQuotes } from '@/features/quotes/hooks';
import { useServices } from '@/features/services/hooks';
import { createAvatarSignedUrl } from '@/features/profile/avatar';
import { getMyProfile } from '@/features/profile/api';
import { useAuth } from '@/providers/AuthProvider';
import type { HomeDashboardData } from '@/features/home/api';

jest.mock('@/features/business/hooks', () => ({ useMyBusiness: jest.fn() }));
jest.mock('@/features/home/hooks', () => ({ useHomeDashboard: jest.fn() }));
jest.mock('@/features/quotes/hooks', () => ({ useQuotes: jest.fn() }));
jest.mock('@/features/services/hooks', () => ({ useServices: jest.fn() }));
jest.mock('@/features/profile/avatar', () => ({
  ...jest.requireActual('@/features/profile/avatar'),
  createAvatarSignedUrl: jest.fn(),
}));
jest.mock('@/features/profile/api', () => ({
  getMyProfile: jest.fn(),
  profileQueryKey: (userId: string) => ['private', userId, 'profile'],
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    AnimatedPressable: Pressable,
    FadeInView: View,
    useReducedMotion: () => true,
  };
});

const profile = {
  id: 'user-1',
  full_name: 'Ana Silva',
  phone: '11999999999',
  avatar_path: null,
  created_at: '2026-08-25T00:00:00Z',
  updated_at: '2026-08-25T00:00:00Z',
};
const dashboardFixture: HomeDashboardData = {
  businessId: 'business-1',
  period: 'month',
  periodStart: '2026-08-01',
  periodEnd: '2026-09-01',
  approvedCents: 150000,
  previousApprovedCents: 100000,
  previousApprovedCount: 1,
  previousQuoteCount: 1,
  negotiatingCents: 50000,
  approvedCount: 2,
  openCount: 1,
  quoteCount: 3,
  monthly: [{ month: '2026-08-01', approvedCents: 150000 }],
  clients: { total: 3, active: 2, inactive: 1 },
  services: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(useAuth)
    .mockReturnValue({ user: { id: 'user-1' } } as ReturnType<typeof useAuth>);
  jest.mocked(getMyProfile).mockResolvedValue(profile);
  jest.mocked(useMyBusiness).mockReturnValue({
    data: {
      id: 'business-1',
      onboarding_completed: true,
      email: 'ana@example.com',
    },
  } as ReturnType<typeof useMyBusiness>);
  jest.mocked(useHomeDashboard).mockReturnValue({
    data: dashboardFixture,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useHomeDashboard>);
  jest.mocked(useQuotes).mockReturnValue({
    data: { pages: [{ items: [], totalCount: 0 }] },
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useQuotes>);
  jest.mocked(useServices).mockReturnValue({
    data: { pages: [{ items: [], totalCount: 0 }] },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useServices>);
});

async function renderWithClient(element: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0, retry: false } },
  });
  const screen = await render(
    <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>,
  );
  return { queryClient, screen };
}

it('shows the personalized CRM dashboard with real sections', async () => {
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  expect(await screen.findByText(/Ana\.$/)).toBeTruthy();
  expect(screen.getByText('ResolveMEI')).toBeTruthy();
  expect(screen.getByText('EM NEGOCIAÇÃO')).toBeTruthy();
  expect(screen.getByText('Valor dos orçamentos enviados')).toBeTruthy();
  expect(screen.getByText('Novo orçamento')).toBeTruthy();
  expect(screen.queryByText('Ver perfil')).toBeNull();
  await screen.unmount();
  queryClient.clear();
});

it('uses the personal profile initial when there is no avatar', async () => {
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  expect(await screen.findByTestId('profile-image-fallback')).toBeTruthy();
  expect(createAvatarSignedUrl).not.toHaveBeenCalled();
  await screen.unmount();
  queryClient.clear();
});

it('shows a temporary signed personal avatar', async () => {
  jest
    .mocked(getMyProfile)
    .mockResolvedValue({ ...profile, avatar_path: 'user-1/avatar.webp' });
  jest
    .mocked(createAvatarSignedUrl)
    .mockResolvedValue('https://signed.example/avatar');
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  expect((await screen.findByTestId('profile-image')).props.source).toEqual({
    uri: 'https://signed.example/avatar',
  });
  await screen.unmount();
  queryClient.clear();
});

it('falls back safely when the profile name is empty', async () => {
  jest.mocked(getMyProfile).mockResolvedValue({ ...profile, full_name: '   ' });
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  expect(await screen.findByTestId('profile-image-fallback')).toBeTruthy();
  expect(screen.getByText('U')).toBeTruthy();
  await screen.unmount();
  queryClient.clear();
});
