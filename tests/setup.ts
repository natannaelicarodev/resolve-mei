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

// react-native-worklets (react-native-reanimated 4's runtime) ships its own
// Jest mock; without it, importing it in tests tries to load the native
// TurboModule and crashes. See https://docs.swmansion.com/react-native-worklets/docs/guides/testing/
jest.mock('react-native-worklets', () =>
  jest.requireActual('react-native-worklets/src/mock'),
);

// useSafeAreaInsets() throws without a <SafeAreaProvider> ancestor (unlike
// SafeAreaView, which degrades gracefully). Components that call the hook
// directly (e.g. the bottom navigation bar) need this in every test that
// renders them, regardless of whether the test itself wraps a Provider.
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

// @gorhom/bottom-sheet's own animated/gesture internals aren't meaningful to
// exercise in Jest; its official mock always renders sheet content instead of
// gating it on present()/dismiss(), which is the documented, accepted
// simplification for this library in tests.
jest.mock('@gorhom/bottom-sheet', () =>
  jest.requireActual('@gorhom/bottom-sheet/mock'),
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
