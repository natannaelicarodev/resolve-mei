import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import HomeRoute from '@app/(protected)/home';
import { useMyBusiness } from '@/features/business/hooks';
import { useActiveClientCount } from '@/features/clients/hooks';
import { useServices } from '@/features/services/hooks';
import { createAvatarSignedUrl } from '@/features/profile/avatar';
import { getMyProfile } from '@/features/profile/api';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/business/hooks', () => ({ useMyBusiness: jest.fn() }));
jest.mock('@/features/clients/hooks', () => ({
  useActiveClientCount: jest.fn(),
}));
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

/** A business with everything set up, so no suggestion is offered. */
function settledBusiness() {
  jest.mocked(useMyBusiness).mockReturnValue({
    data: {
      id: 'business-1',
      business_name: 'Elétrica Meireles',
      onboarding_completed: true,
      email: 'ana@example.com',
      logo_path: 'business-1/logo.webp',
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useMyBusiness>);
  jest.mocked(useServices).mockReturnValue({
    data: { pages: [{ items: [], totalCount: 12 }] },
    isLoading: false,
  } as unknown as ReturnType<typeof useServices>);
  jest.mocked(useActiveClientCount).mockReturnValue({
    data: 28,
    isLoading: false,
  } as unknown as ReturnType<typeof useActiveClientCount>);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(useAuth)
    .mockReturnValue({ user: { id: 'user-1' } } as ReturnType<typeof useAuth>);
  jest.mocked(getMyProfile).mockResolvedValue(profile);
  settledBusiness();
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

it('greets the owner and names their business', async () => {
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  expect(await screen.findByText(/Ana$/)).toBeTruthy();
  expect(screen.getByText('Elétrica Meireles')).toBeTruthy();
  await screen.unmount();
  queryClient.clear();
});

it('leads with starting a quote', async () => {
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  await screen.findByText(/Ana$/);
  expect(screen.getByText('Comece um orçamento')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Novo orçamento' })).toBeTruthy();
  await screen.unmount();
  queryClient.clear();
});

it('keeps only destinations absent from the bottom navigation in the business grid', async () => {
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  await screen.findByText(/Ana$/);
  expect(screen.getByText('Gerencie seu negócio')).toBeTruthy();
  for (const label of ['Orçamentos', 'Serviços', 'Despesas'])
    expect(screen.getByRole('button', { name: label })).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'Clientes' })).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'Agenda' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Meu negócio' })).toBeNull();
  await screen.unmount();
  queryClient.clear();
});

it('keeps money and totals off the hub', async () => {
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  await screen.findByText(/Ana$/);
  // Balances belong to their own screen; a figure the owner cannot act on
  // from here is decoration.
  expect(screen.queryByText(/R\$/)).toBeNull();
  expect(screen.queryByText(/Aprovado no período/)).toBeNull();
  await screen.unmount();
  queryClient.clear();
});

it('suggests cataloguing a service when there are none', async () => {
  jest.mocked(useServices).mockReturnValue({
    data: { pages: [{ items: [], totalCount: 0 }] },
    isLoading: false,
  } as unknown as ReturnType<typeof useServices>);
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  await screen.findByText(/Ana$/);
  expect(screen.getByText('Cadastre seu primeiro serviço')).toBeTruthy();
  await screen.unmount();
  queryClient.clear();
});

it('moves on to clients once services exist', async () => {
  jest.mocked(useActiveClientCount).mockReturnValue({
    data: 0,
    isLoading: false,
  } as unknown as ReturnType<typeof useActiveClientCount>);
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  await screen.findByText(/Ana$/);
  // Services are catalogued, so the next real gap is a client to quote.
  expect(screen.getByText('Adicione seu primeiro cliente')).toBeTruthy();
  expect(screen.queryByText('Cadastre seu primeiro serviço')).toBeNull();
  await screen.unmount();
  queryClient.clear();
});

it('suggests a logo once the essentials are done', async () => {
  jest.mocked(useMyBusiness).mockReturnValue({
    data: {
      id: 'business-1',
      business_name: 'Elétrica Meireles',
      onboarding_completed: true,
      email: 'ana@example.com',
      logo_path: null,
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useMyBusiness>);
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  await screen.findByText(/Ana$/);
  expect(screen.getByText('Coloque sua marca nos orçamentos')).toBeTruthy();
  await screen.unmount();
  queryClient.clear();
});

it('offers nothing to set up when the business is complete', async () => {
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  await screen.findByText(/Ana$/);
  // An empty space beats an invented task.
  expect(screen.queryByText(/Cadastre seu primeiro/)).toBeNull();
  expect(screen.queryByText(/Adicione seu primeiro/)).toBeNull();
  expect(screen.queryByText(/Coloque sua marca/)).toBeNull();
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
