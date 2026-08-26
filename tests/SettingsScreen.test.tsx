import { Alert } from 'react-native';
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
  const alert = jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_title, _message, buttons) =>
      buttons?.[0]?.onPress?.(),
    );
  const screen = await render(<SettingsScreen />);
  expect(screen.getByText('ana@example.com')).toBeTruthy();
  expect(screen.getByText(/ResolveMEI 1\.0\.0/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Sair da conta' }));
  expect(alert).toHaveBeenCalledWith(
    'Sair da conta?',
    expect.any(String),
    expect.any(Array),
  );
  expect(signOut).not.toHaveBeenCalled();
  alert.mockRestore();
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
  const alert = jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_title, _message, buttons) =>
      buttons?.[1]?.onPress?.(),
    );
  const screen = await render(<SettingsScreen />);
  const button = screen.getByRole('button', { name: 'Sair da conta' });
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(signOut).toHaveBeenCalledTimes(1);
  expect(button).toBeDisabled();
  resolveSignOut();
  await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  alert.mockRestore();
  await screen.unmount();
});
