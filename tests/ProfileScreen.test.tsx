import { fireEvent } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  parseProfileNavigation,
  profileQueryKey,
} from '@/features/profile/ProfileScreen';
import { getMyProfile, updateMyProfile } from '@/features/profile/api';
import { useAuth } from '@/providers/AuthProvider';
import { renderProfile } from './helpers/renderProfile';

jest.mock('@/features/profile/api', () => ({
  getMyProfile: jest.fn(),
  profileQueryKey: (userId: string) => ['private', userId, 'profile'],
  updateMyProfile: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
const mockProfessionalProfileForm = jest.fn((_props: unknown) => null);
jest.mock('@/features/profile/ProfessionalProfileForm', () => ({
  ProfessionalProfileForm: (props: unknown) =>
    mockProfessionalProfileForm(props),
}));

const profile = {
  id: 'user-1',
  full_name: 'Ana Silva',
  phone: '11999999999',
  avatar_path: null,
  created_at: '2026-08-25T00:00:00Z',
  updated_at: '2026-08-25T00:00:00Z',
};
const updated = { ...profile, full_name: 'Ana Souza' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({});
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(getMyProfile).mockResolvedValue(profile);
});

it('shows accessible success and updates profile and business caches', async () => {
  jest.mocked(updateMyProfile).mockResolvedValue(updated);
  const { dispose, invalidateQueries, queryClient, screen } =
    await renderProfile();

  await fireEvent.changeText(
    screen.getByLabelText('Nome completo'),
    'Ana Souza',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Salvar dados pessoais' }),
  );

  const success = await screen.findByText(
    'Dados pessoais atualizados com sucesso.',
  );
  expect(success).toBeTruthy();
  const announcement = screen.getByRole('alert');
  expect(announcement.props.accessible).toBe(true);
  expect(announcement.props.accessibilityLiveRegion).toBe('polite');
  expect(queryClient.getQueryData(profileQueryKey('user-1'))).toEqual(profile);
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: profileQueryKey('user-1'),
  });
  expect(router.replace).not.toHaveBeenCalled();
  await dispose();
});

it('ignores removed image navigation and other invalid parameters', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({
    section: 'personal',
    field: 'logo',
  });
  const personal = await renderProfile();
  expect(personal.screen.getByText('Imagem do perfil')).toBeTruthy();
  expect(mockProfessionalProfileForm).not.toHaveBeenCalled();
  await personal.dispose();

  jest.clearAllMocks();
  jest.mocked(useLocalSearchParams).mockReturnValue({
    section: 'invalid',
    field: 'logo',
  });
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(getMyProfile).mockResolvedValue(profile);
  const normal = await renderProfile();
  expect(normal.screen.getByDisplayValue('Ana Silva')).toBeTruthy();
  expect(mockProfessionalProfileForm).not.toHaveBeenCalled();
  await normal.dispose();
});

it('preserves personal values when opening the phone field contextually', async () => {
  jest.mocked(useLocalSearchParams).mockReturnValue({
    section: 'personal',
    field: 'phone',
  });
  const { dispose, screen } = await renderProfile();

  expect(screen.getByDisplayValue('Ana Silva')).toBeTruthy();
  expect(screen.getByDisplayValue('11999999999')).toBeTruthy();
  expect(screen.getByLabelText('Telefone pessoal')).toBeTruthy();

  await dispose();
});

it('validates only contextual parameters implemented by the profile screen', () => {
  expect(parseProfileNavigation('personal', 'phone')).toEqual({
    tab: 'personal',
    field: 'phone',
  });
  expect(parseProfileNavigation('professional', 'first-required')).toEqual({
    tab: 'professional',
    field: 'first-required',
  });
  expect(parseProfileNavigation('professional', 'email')).toEqual({
    tab: 'professional',
    field: 'email',
  });
  expect(parseProfileNavigation('personal', 'logo')).toBeNull();
  expect(parseProfileNavigation('professional', 'logo')).toBeNull();
  expect(parseProfileNavigation('unknown', 'phone')).toBeNull();
});
