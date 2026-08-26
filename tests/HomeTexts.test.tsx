import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import HomeRoute from '@app/(protected)/home';
import { useMyBusiness } from '@/features/business/hooks';
import { useActiveClientCount } from '@/features/clients/hooks';
import {
  createAvatarSignedUrl,
  getProfileInitial,
} from '@/features/profile/avatar';
import { getMyProfile } from '@/features/profile/api';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/business/hooks', () => ({ useMyBusiness: jest.fn() }));
jest.mock('@/features/clients/hooks', () => ({
  useActiveClientCount: jest.fn(),
}));
jest.mock('@/features/profile/avatar', () => ({
  ...jest.requireActual('@/features/profile/avatar'),
  createAvatarSignedUrl: jest.fn(),
}));
jest.mock('@/features/profile/api', () => ({
  getMyProfile: jest.fn(),
  profileQueryKey: ['profile', 'mine'],
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return { AnimatedPressable: Pressable, FadeInView: View };
});

const profile = {
  id: 'user-1',
  full_name: 'Ana Silva',
  phone: '11999999999',
  avatar_path: null,
  created_at: '2026-08-25T00:00:00Z',
  updated_at: '2026-08-25T00:00:00Z',
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
  jest.mocked(useActiveClientCount).mockReturnValue({
    data: 3,
    isLoading: false,
    isError: false,
  } as ReturnType<typeof useActiveClientCount>);
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

it('shows the CRM home without the redundant business card or logo requirement', async () => {
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  expect(await screen.findByText('Olá, Ana')).toBeTruthy();
  expect(screen.getByText('Ações rápidas')).toBeTruthy();
  expect(screen.getByText('3')).toBeTruthy();
  expect(screen.queryByText('Ver perfil')).toBeNull();
  expect(screen.queryByText(/Perfil configurado/i)).toBeNull();
  expect(screen.queryByText(/Adicionar logotipo/i)).toBeNull();
  expect(screen.getByLabelText('Perfil')).toBeTruthy();
  await screen.unmount();
  queryClient.clear();
});

it('uses the personal profile initial when there is no avatar', async () => {
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  expect(await screen.findByText('Olá, Ana')).toBeTruthy();
  expect(screen.getByTestId('profile-image-fallback')).toBeTruthy();
  expect(screen.getByText('A')).toBeTruthy();
  expect(createAvatarSignedUrl).not.toHaveBeenCalled();
  await screen.unmount();
  queryClient.clear();
});

it('handles an empty name with a safe fallback', async () => {
  jest.mocked(getMyProfile).mockResolvedValue({ ...profile, full_name: '   ' });
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  expect(await screen.findByText('Olá')).toBeTruthy();
  expect(screen.getByTestId('profile-image-fallback')).toBeTruthy();
  expect(getProfileInitial('   ')).toBe('U');
  expect(getProfileInitial('  -Érica')).toBe('É');
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
  const image = await screen.findByTestId('profile-image');
  expect(image.props.source).toEqual({ uri: 'https://signed.example/avatar' });
  expect(createAvatarSignedUrl).toHaveBeenCalledWith('user-1/avatar.webp');
  await screen.unmount();
  queryClient.clear();
});

it('falls back without exposing a broken image when signing fails', async () => {
  jest
    .mocked(getMyProfile)
    .mockResolvedValue({ ...profile, avatar_path: 'user-1/avatar.webp' });
  jest
    .mocked(createAvatarSignedUrl)
    .mockRejectedValue(new Error('sign failed'));
  const { queryClient, screen } = await renderWithClient(<HomeRoute />);
  expect(await screen.findByTestId('profile-image-fallback')).toBeTruthy();
  expect(screen.queryByTestId('profile-image')).toBeNull();
  await screen.unmount();
  queryClient.clear();
});
