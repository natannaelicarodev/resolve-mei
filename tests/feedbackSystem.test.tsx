import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Button,
  ConfirmationDialog,
  ToastProvider,
  useToast,
} from '@/components/ui';
import { ThemeProvider } from '@/theme';

const metrics = {
  frame: { height: 800, width: 400, x: 0, y: 0 },
  insets: { bottom: 24, left: 0, right: 0, top: 24 },
};

function ToastTrigger() {
  const { showToast } = useToast();
  return (
    <Button
      label="Salvar"
      onPress={() =>
        showToast({
          message: 'O cliente já está disponível.',
          title: 'Cliente criado',
          variant: 'success',
        })
      }
    />
  );
}

function renderFeedback(node: React.ReactNode) {
  return render(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
        <ToastProvider>{node}</ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('feedback system', () => {
  it('shows one dismissible, accessible toast', async () => {
    const screen = await renderFeedback(<ToastTrigger />);
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByText('Cliente criado')).toBeTruthy();
    expect(screen.getByText('O cliente já está disponível.')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Fechar mensagem' }),
    );
  });

  it('keeps confirmation and cancellation as explicit actions', async () => {
    const confirm = jest.fn();
    const cancel = jest.fn();
    const screen = await renderFeedback(
      <ConfirmationDialog
        confirmLabel="Sair"
        description="Você precisará entrar novamente."
        destructive
        onCancel={cancel}
        onConfirm={confirm}
        title="Sair da conta?"
        visible
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
