import { fireEvent, render } from '@testing-library/react-native';

import { SegmentedControl } from '@/components/ui';
import { ThemeProvider } from '@/theme';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 0, Warning: 1, Error: 2 },
}));

const OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
] as const;

/**
 * The selected state is drawn by one pill behind the options rather than a
 * background painted on each of them. That is what lets the selection slide:
 * with a per-option background, changing selection repaints two options at
 * once and the indicator appears to teleport.
 */
it('draws the selection as a single layer, not a per-option background', async () => {
  const screen = await render(
    <ThemeProvider>
      <SegmentedControl
        label="Filtrar clientes"
        onChange={jest.fn()}
        options={OPTIONS}
        value="all"
      />
    </ThemeProvider>,
  );

  // No option carries its own selected background — only the shared pill does.
  for (const option of OPTIONS) {
    const radio = screen.getByRole('radio', { name: option.label });
    const style = radio.props.style as { backgroundColor?: string }[] | object;
    const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect((flat as { backgroundColor?: string }).backgroundColor).toBe(
      undefined,
    );
  }

  await screen.unmount();
});

it('keeps the selected option announced to assistive technology', async () => {
  const screen = await render(
    <ThemeProvider>
      <SegmentedControl
        label="Filtrar clientes"
        onChange={jest.fn()}
        options={OPTIONS}
        value="active"
      />
    </ThemeProvider>,
  );

  // The pill is decorative: selection has to stay readable from the option's
  // own accessibility state, never from the moving layer.
  expect(
    screen.getByRole('radio', { name: 'Ativos' }).props.accessibilityState,
  ).toMatchObject({ checked: true, selected: true });
  expect(
    screen.getByRole('radio', { name: 'Todos' }).props.accessibilityState,
  ).toMatchObject({ checked: false, selected: false });

  await screen.unmount();
});

it('reports the newly chosen option and ignores a repeat tap', async () => {
  const onChange = jest.fn();
  const screen = await render(
    <ThemeProvider>
      <SegmentedControl
        label="Filtrar clientes"
        onChange={onChange}
        options={OPTIONS}
        value="all"
      />
    </ThemeProvider>,
  );

  fireEvent.press(screen.getByRole('radio', { name: 'Inativos' }));
  expect(onChange).toHaveBeenCalledWith('inactive');

  onChange.mockClear();
  fireEvent.press(screen.getByRole('radio', { name: 'Todos' }));
  expect(onChange).not.toHaveBeenCalled();

  await screen.unmount();
});
