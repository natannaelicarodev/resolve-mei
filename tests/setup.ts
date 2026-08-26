Object.assign(process.env, {
  EXPO_PUBLIC_APP_ENV: 'development',
  EXPO_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_value_only_123456',
});

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual(
    '@react-native-async-storage/async-storage/jest/async-storage-mock',
  ),
);

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    dismissTo: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: Object.assign('Stack', { Screen: 'Screen' }),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(),
}));
