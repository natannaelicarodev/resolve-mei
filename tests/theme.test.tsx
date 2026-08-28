import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { ThemeProvider, useTheme } from '@/theme';

function ThemeProbe() {
  const { colors, preference, resolvedTheme, setPreference } = useTheme();
  return (
    <>
      <Text>{`${preference}:${resolvedTheme}:${colors.background}`}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void setPreference('dark')}
      >
        <Text>Usar escuro</Text>
      </Pressable>
    </>
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('starts in dark theme when there is no saved preference', async () => {
  const screen = await render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
  expect(screen.getByText(/^dark:dark:/)).toBeTruthy();
});

it('hydrates and persists the local theme preference', async () => {
  await AsyncStorage.setItem('@resolve-mei/theme-preference', 'light');
  const screen = await render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
  await waitFor(() => expect(screen.getByText(/^light:light:/)).toBeTruthy());

  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Usar escuro' }));
  });
  expect(screen.getByText(/^dark:dark:/)).toBeTruthy();
  expect(await AsyncStorage.getItem('@resolve-mei/theme-preference')).toBe(
    'dark',
  );
});

it('uses a dark surface without absolute black', async () => {
  const screen = await render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Usar escuro' }));
  });
  expect(screen.getByText(/^dark:dark:/)).toBeTruthy();
  expect(screen.queryByText(/:#000000$/i)).toBeNull();
});
