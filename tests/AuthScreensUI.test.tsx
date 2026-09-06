import { fireEvent, render } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

it('keeps the approved blue auth header with the Tavi wordmark', () => {
  const source = readFileSync(
    resolve('src/features/auth/AuthShell.tsx'),
    'utf8',
  );

  expect(source).toContain('{brandMark(colors.textInverse)}');
  expect(source).toContain('backgroundColor: colors.primary');
  expect(source).toContain('style="light"');
});

it('keeps login data after an error and toggles password visibility', async () => {
  jest.mocked(signIn).mockRejectedValue(new Error('technical detail'));
  const screen = await render(<SignInScreen />);
  expect(screen.getByLabelText('Logotipo do Tavi')).toBeTruthy();
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
  expect(screen.getByLabelText('8 ou mais caracteres: pendente')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Senha'), 'Senha123');
  expect(screen.getByLabelText('8 ou mais caracteres: atendido')).toBeTruthy();
  expect(screen.getByLabelText('Uma letra minúscula: atendido')).toBeTruthy();
  expect(screen.getByLabelText('Uma letra maiúscula: atendido')).toBeTruthy();
  expect(screen.getByLabelText('Um número: atendido')).toBeTruthy();
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
