import { fireEvent, render } from '@testing-library/react-native';

import { ForgotPasswordScreen } from '@/features/auth/ForgotPasswordScreen';
import { SignInScreen } from '@/features/auth/SignInScreen';
import { SignUpScreen } from '@/features/auth/SignUpScreen';
import { requestPasswordReset, signIn, signUp } from '@/features/auth/api';

jest.mock('@/features/auth/api', () => ({
  requestPasswordReset: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
}));
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
  router: { replace: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

it('keeps login data after an error and toggles password visibility', async () => {
  jest.mocked(signIn).mockRejectedValue(new Error('technical detail'));
  const screen = await render(<SignInScreen />);
  expect(screen.getByLabelText('Logotipo do ResolveMEI')).toBeTruthy();
  await fireEvent.changeText(
    screen.getByLabelText('E-mail'),
    'ana@example.com',
  );
  await fireEvent.changeText(screen.getByLabelText('Senha'), 'Senha123');
  expect(screen.getByLabelText('Senha')).toHaveProp('secureTextEntry', true);
  await fireEvent.press(screen.getByRole('button', { name: 'Mostrar senha' }));
  expect(screen.getByLabelText('Senha')).toHaveProp('secureTextEntry', false);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
  expect(
    await screen.findByText('Ocorreu um erro inesperado. Tente novamente.'),
  ).toBeTruthy();
  expect(screen.getByDisplayValue('ana@example.com')).toBeTruthy();
  expect(screen.getByDisplayValue('Senha123')).toBeTruthy();
  await screen.unmount();
});

it('updates password requirements progressively during sign-up', async () => {
  const screen = await render(<SignUpScreen />);
  expect(screen.getByText('• 8 ou mais caracteres')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Senha'), 'Senha123');
  expect(screen.getByText('• 8 ou mais caracteres')).toBeTruthy();
  expect(screen.getByText('• Uma letra minúscula')).toBeTruthy();
  expect(screen.getByText('• Uma letra maiúscula')).toBeTruthy();
  expect(screen.getByText('• Um número')).toBeTruthy();
  expect(signUp).not.toHaveBeenCalled();
  await screen.unmount();
});

it('shows a neutral recovery success without confirming account existence', async () => {
  jest.mocked(requestPasswordReset).mockResolvedValue(undefined);
  const screen = await render(<ForgotPasswordScreen />);
  await fireEvent.changeText(
    screen.getByLabelText('E-mail'),
    'ana@example.com',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Enviar instruções' }),
  );
  expect(
    await screen.findByText(
      'Se o e-mail estiver cadastrado, enviaremos as instruções.',
    ),
  ).toBeTruthy();
  expect(requestPasswordReset).toHaveBeenCalledWith('ana@example.com');
  await screen.unmount();
});
