import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { SettingsScreen } from '@/features/auth/SettingsScreen';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

it('shows account information and allows logout cancellation', async () => {
  const signOut = jest.fn();
  jest.mocked(useAuth).mockReturnValue({
    user: { email: 'ana@example.com' },
    signOut,
  } as unknown as ReturnType<typeof useAuth>);
  const screen = await render(<SettingsScreen />);
  expect(screen.getByText('ana@example.com')).toBeTruthy();
  expect(screen.getByText(/Tavi 1\.0\.0/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Sair da conta' }));
  expect(screen.getByText('Sair da conta?')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
  expect(signOut).not.toHaveBeenCalled();
  await screen.unmount();
});

it('confirms logout and blocks duplicate execution while loading', async () => {
  let resolveSignOut!: () => void;
  const signOut = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      }),
  );
  jest.mocked(useAuth).mockReturnValue({
    user: { email: 'ana@example.com' },
    signOut,
  } as unknown as ReturnType<typeof useAuth>);
  const screen = await render(<SettingsScreen />);
  const button = screen.getByRole('button', { name: 'Sair da conta' });
  await fireEvent.press(button);
  const confirm = await screen.findByRole('button', { name: 'Sair' });
  await fireEvent.press(confirm);
  await fireEvent.press(confirm);
  expect(signOut).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  resolveSignOut();
  await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  await screen.unmount();
});
