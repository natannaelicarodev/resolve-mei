import { act, fireEvent, waitFor } from '@testing-library/react-native';
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

it('prevents duplicate submissions and does not redirect before success', async () => {
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
  let rejectUpdate!: (reason: Error) => void;
  jest.mocked(updateMyProfile).mockReturnValue(
    new Promise((_resolve, reject) => {
      rejectUpdate = reject;
    }),
  );
  const { dispose, screen } = await renderProfile();
  const save = screen.getByRole('button', {
    name: 'Salvar dados pessoais',
  });

  await fireEvent.press(save);
  await fireEvent.press(save);

  await waitFor(() => expect(updateMyProfile).toHaveBeenCalledTimes(1));
  expect(router.replace).not.toHaveBeenCalled();
  await act(async () => {
    rejectUpdate(new Error('controlled failure'));
  });
  expect(
    await screen.findByText('Ocorreu um erro inesperado. Tente novamente.'),
  ).toBeTruthy();
  await dispose();
});
