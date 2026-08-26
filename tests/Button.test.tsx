import { fireEvent, render } from '@testing-library/react-native';

import { Button } from '@/components/ui';

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
