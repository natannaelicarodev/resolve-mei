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
  expect(screen.getByText(/ResolveMEI 1\.0\.0/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Sair da conta' }));
  // The confirmation is a real in-app dialog, not a native alert.
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

  // Both the trigger and the dialog's confirm button share this label; the
  // dialog's is the one rendered last.
  const confirmAction = screen
    .getAllByRole('button', { name: 'Sair da conta' })
    .at(-1)!;
  await fireEvent.press(confirmAction);
  await fireEvent.press(confirmAction);

  expect(signOut).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  resolveSignOut();
  await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  await screen.unmount();
});
