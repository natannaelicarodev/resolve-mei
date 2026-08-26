import { fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { getMyProfile, updateMyProfile } from '@/features/profile/api';
import { useAuth } from '@/providers/AuthProvider';
import { renderProfile } from './helpers/renderProfile';

jest.mock('@/features/profile/api', () => ({
  getMyProfile: jest.fn(),
  profileQueryKey: ['profile', 'mine'],
  updateMyProfile: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/profile/ProfessionalProfileForm', () => ({
  ProfessionalProfileForm: () => null,
}));

it('keeps entered data and stays on screen when saving fails', async () => {
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(getMyProfile).mockResolvedValue({
    id: 'user-1',
    full_name: 'Ana Silva',
    phone: null,
    avatar_path: null,
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-08-25T00:00:00Z',
  });
  jest.mocked(updateMyProfile).mockRejectedValue(new Error('database detail'));
  const { dispose, screen } = await renderProfile();

  await fireEvent.changeText(
    screen.getByLabelText('Nome completo'),
    'Ana Souza',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Salvar dados pessoais' }),
  );

  expect(
    await screen.findByText('Ocorreu um erro inesperado. Tente novamente.'),
  ).toBeTruthy();
  expect(screen.getByDisplayValue('Ana Souza')).toBeTruthy();
  expect(router.replace).not.toHaveBeenCalled();
  await dispose();
});
