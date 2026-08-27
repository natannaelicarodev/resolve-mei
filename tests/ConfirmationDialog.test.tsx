import { fireEvent, render } from '@testing-library/react-native';

import { ConfirmationDialog } from '@/components/ui';

async function setup(
  props: Partial<React.ComponentProps<typeof ConfirmationDialog>> = {},
) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const screen = await render(
    <ConfirmationDialog
      confirmLabel="Excluir permanentemente"
      description="Esta ação não pode ser desfeita."
      destructive
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Excluir registro?"
      visible
      {...props}
    />,
  );
  return { screen, onConfirm, onCancel };
}

describe('ConfirmationDialog', () => {
  it('shows the title, description and both actions', async () => {
    const { screen } = await setup();

    expect(screen.getByText('Excluir registro?')).toBeTruthy();
    expect(screen.getByText('Esta ação não pode ser desfeita.')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Excluir permanentemente' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });

  it('marks a destructive confirmation with the non-color alert icon', async () => {
    const { screen } = await setup();

    // The guarantee added to Button must reach the real destructive path.
    expect(screen.getByTestId('button-danger-icon')).toBeTruthy();
  });

  it('does not mark a non-destructive confirmation as dangerous', async () => {
    const { screen } = await setup({
      confirmLabel: 'Duplicar',
      destructive: false,
    });

    expect(screen.queryByTestId('button-danger-icon')).toBeNull();
  });

  it('confirms and cancels through the respective actions', async () => {
    const { screen, onConfirm } = await setup();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Excluir permanentemente' }),
    );
    expect(onConfirm).toHaveBeenCalledTimes(1);

    const second = await setup();
    await fireEvent.press(
      second.screen.getByRole('button', { name: 'Cancelar' }),
    );
    expect(second.onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores a double tap on the confirm action', async () => {
    const { screen, onConfirm } = await setup();
    const confirm = screen.getByRole('button', {
      name: 'Excluir permanentemente',
    });

    await fireEvent.press(confirm);
    await fireEvent.press(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('dismisses safely through the backdrop', async () => {
    const { screen, onCancel, onConfirm } = await setup();

    await fireEvent.press(screen.getByLabelText('Fechar Excluir registro?'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('blocks both actions while the confirmation is pending', async () => {
    const { screen, onConfirm, onCancel } = await setup({ loading: true });

    await fireEvent.press(
      screen.getByRole('button', { name: 'Excluir permanentemente' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('renders nothing while hidden', async () => {
    const { screen } = await setup({ visible: false });

    expect(screen.queryByText('Excluir registro?')).toBeNull();
  });
});
