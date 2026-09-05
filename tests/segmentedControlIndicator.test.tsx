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
 * Selection used to be painted by a single pill sliding behind the options,
 * positioned from another element's measured `onLayout` frame. On device
 * that shipped two confirmed bugs in sequence: the pill going permanently
 * invisible after the first frame (fixed by giving the selected option its
 * own fallback background), and then — with both the pill and the fallback
 * painting at once — two overlapping layers with slightly different
 * geometry rendering as a visibly deformed edge (a `height: '100%'` fix
 * attempt made it worse: an unbounded percentage height in that scrollable
 * layout resolved against a far ancestor and filled the whole screen).
 * Each option now animates its own background via a shared value — there is
 * only one layer, so there's nothing to test for a second element's frame or
 * a background style object; `interpolateColor` runs as a worklet on the UI
 * thread and isn't observable as a plain prop from here. What stays testable
 * and load-bearing is that exactly one option is marked selected at a time —
 * that state, not a style prop, is what the checkmark and label color read
 * from.
 */
it('marks exactly one option as selected', async () => {
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

  const radios = screen.getAllByRole('radio');
  const selected = radios.filter(
    (radio) => radio.props.accessibilityState?.selected === true,
  );
  expect(selected).toHaveLength(1);
  expect(selected[0]?.props.accessibilityLabel).toBe('Todos');

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
