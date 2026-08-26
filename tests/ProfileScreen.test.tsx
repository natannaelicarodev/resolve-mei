import { fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import { profileQueryKey } from '@/features/profile/ProfileScreen';
import { getMyProfile, updateMyProfile } from '@/features/profile/api';
import { useAuth } from '@/providers/AuthProvider';
import { renderProfile } from './helpers/renderProfile';

jest.mock('@/features/profile/api', () => ({
  getMyProfile: jest.fn(),
  updateMyProfile: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/profile/ProfessionalProfileForm', () => ({
  ProfessionalProfileForm: () => null,
}));

const profile = {
  id: 'user-1',
  full_name: 'Ana Silva',
  phone: '11999999999',
  created_at: '2026-08-25T00:00:00Z',
  updated_at: '2026-08-25T00:00:00Z',
};
const updated = { ...profile, full_name: 'Ana Souza' };

it('shows accessible success and updates profile and business caches', async () => {
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(getMyProfile).mockResolvedValue(profile);
  jest.mocked(updateMyProfile).mockResolvedValue(updated);
  const { dispose, invalidateQueries, queryClient, screen } =
    await renderProfile();

  fireEvent.changeText(screen.getByLabelText('Nome completo'), 'Ana Souza');
  fireEvent.press(
    screen.getByRole('button', { name: 'Salvar dados pessoais' }),
  );

  const success = await screen.findByText(
    'Dados pessoais atualizados com sucesso.',
  );
  expect(success.props.accessible).toBe(true);
  expect(success.props.accessibilityLiveRegion).toBe('polite');
  expect(queryClient.getQueryData(profileQueryKey)).toEqual(profile);
  expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: profileQueryKey });
  expect(router.replace).not.toHaveBeenCalled();
  await dispose();
});
