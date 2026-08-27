import { fireEvent, render } from '@testing-library/react-native';

import { Button, Text } from '@/components/ui';

describe('Button', () => {
  it('renders and handles a press', async () => {
    const onPress = jest.fn();
    const screen = await render(<Button label="Continuar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not handle presses while disabled', async () => {
    const onPress = jest.fn();
    const screen = await render(
      <Button disabled label="Continuar" onPress={onPress} />,
    );
    const button = screen.getByRole('button', { name: 'Continuar' });

    await fireEvent.press(button);

    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders an alert icon by default on the danger variant', async () => {
    const screen = await render(<Button label="Excluir" variant="danger" />);

    // Destructive intent must not rely on color alone.
    expect(screen.getByTestId('button-danger-icon')).toBeTruthy();
  });

  it('lets an explicit icon override the danger default', async () => {
    const screen = await render(
      <Button icon={<Text>custom</Text>} label="Excluir" variant="danger" />,
    );

    expect(screen.getByText('custom')).toBeTruthy();
    expect(screen.queryByTestId('button-danger-icon')).toBeNull();
  });

  it('does not add the alert icon to non-danger variants', async () => {
    const screen = await render(<Button label="Salvar" variant="primary" />);

    expect(screen.queryByTestId('button-danger-icon')).toBeNull();
  });

  it('hides the danger icon while loading', async () => {
    const screen = await render(
      <Button label="Excluir" loading variant="danger" />,
    );

    expect(screen.queryByTestId('button-danger-icon')).toBeNull();
    expect(screen.getByLabelText('Carregando')).toBeTruthy();
  });

  it('shows a loading state and blocks interaction', async () => {
    const screen = await render(<Button label="Salvar" loading />);
    const button = screen.getByRole('button', { name: 'Salvar' });

    expect(button).toBeDisabled();
    expect(button).toHaveProp('accessibilityState', {
      busy: true,
      disabled: true,
    });
    expect(screen.getByLabelText('Carregando')).toBeTruthy();
  });
});
