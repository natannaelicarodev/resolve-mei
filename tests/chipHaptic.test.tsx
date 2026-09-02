import * as Haptics from 'expo-haptics';
import { fireEvent, render } from '@testing-library/react-native';

import { Chip } from '@/components/ui';
import { ThemeProvider } from '@/theme';

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 0, Warning: 1, Error: 2 },
}));

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Touch feedback is silent: nothing on screen shows whether a tap vibrated, so
 * a regression here is invisible in review and on a simulator. These checks pin
 * the elements a user taps most to the selection haptic the Home has always had.
 *
 * One case per file: after a press plus unmount, a later render in the same
 * file comes back empty under this harness.
 */

it('fires a selection haptic when a chip is tapped', async () => {
  const onPress = jest.fn();
  const screen = await render(
    <ThemeProvider>
      <Chip label="Aprovados" onPress={onPress} />
    </ThemeProvider>,
  );

  fireEvent.press(screen.getByLabelText('Aprovados'));

  expect(onPress).toHaveBeenCalled();
  expect(Haptics.selectionAsync).toHaveBeenCalled();

  await screen.unmount();
});
