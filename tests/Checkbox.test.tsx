import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Checkbox } from '@/components/ui';

describe('Checkbox', () => {
  it('exposes its label and state and keeps a visible glyph when checked', async () => {
    const onChange = jest.fn();
    const screen = await render(
      <Checkbox checked label="Resumo mensal" onChange={onChange} />,
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Resumo mensal' });
    expect(checkbox.props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByTestId('checkbox-checked-icon')).toBeTruthy();

    fireEvent.press(checkbox);
    expect(onChange).toHaveBeenCalledWith(false);
  });

  // A marca fica montada nos dois estados para poder animar a saída, então
  // presença no DOM já não distingue marcado de desmarcado: quem carrega isso
  // visualmente é a opacidade.
  it('hides the glyph while unchecked', async () => {
    const screen = await render(
      <Checkbox checked={false} label="Resumo mensal" onChange={jest.fn()} />,
    );

    const mark = screen.getByTestId('checkbox-checked-icon').parent;
    const style = StyleSheet.flatten(mark?.props.style) as
      { opacity?: number } | undefined;
    expect(style?.opacity).toBe(0);

    expect(
      screen.getByRole('checkbox', { name: 'Resumo mensal' }).props
        .accessibilityState,
    ).toEqual({ checked: false });
  });

  it('announces validation feedback without changing the touch target', async () => {
    const screen = await render(
      <Checkbox
        checked={false}
        error="Selecione uma opção."
        label="Aceitar termos"
        onChange={jest.fn()}
      />,
    );

    expect(
      screen.getByRole('checkbox', { name: 'Aceitar termos' }).props
        .accessibilityHint,
    ).toBe('Selecione uma opção.');
    expect(
      screen.getByText('Selecione uma opção.').props.accessibilityLiveRegion,
    ).toBe('polite');
  });
});
