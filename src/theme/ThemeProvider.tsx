import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from './colors';
import type { ThemeColors } from './colors';

export type ThemePreference = 'system' | 'light' | 'dark';
type ResolvedTheme = 'light' | 'dark';

// v2 intentionally resets the previous light/system default once. From this
// version onward, new installs and migrated installs start dark; subsequent
// choices are persisted normally under the new key.
const STORAGE_KEY = '@resolve-mei/theme-preference-v2';

interface ThemeContextValue {
  colors: ThemeColors;
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  preference: 'dark',
  resolvedTheme: 'dark',
  setPreference: async () => undefined,
});

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (active && isThemePreference(stored)) setPreferenceState(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const resolvedTheme: ResolvedTheme =
    preference === 'system'
      ? systemTheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;
  const value = useMemo(
    () => ({
      colors: resolvedTheme === 'dark' ? darkColors : lightColors,
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function DarkThemeScope({ children }: PropsWithChildren) {
  const parent = useTheme();
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: darkColors,
      preference: 'dark',
      resolvedTheme: 'dark',
      setPreference: parent.setPreference,
    }),
    [parent.setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Dev-only counterpart used by the design-preview route to render a subtree
// in light mode regardless of the app's real (dark) default preference.
export function LightThemeScope({ children }: PropsWithChildren) {
  const parent = useTheme();
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: lightColors,
      preference: 'light',
      resolvedTheme: 'light',
      setPreference: parent.setPreference,
    }),
    [parent.setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
