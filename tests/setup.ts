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

// Reanimated 4 initialises react-native-worklets on import, and that package
// reaches for a native module Jest does not have. Stubbing worklets first lets
// the library's own mock load cleanly.
jest.mock('react-native-worklets', () => ({
  createSerializable: (value: unknown) => value,
  createWorkletRuntime: () => ({}),
  isWorkletFunction: () => false,
  runOnJS:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args),
  runOnUI:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args),
  scheduleOnRN:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args),
  scheduleOnUI:
    (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) =>
      fn(...args),
}));

// A hand-written stub rather than the library's own mock: the shipped mock also
// pulls in the native initialisers. This covers exactly the surface the app
// uses — shared values with get/set, the animation helpers (which resolve to
// their target immediately) and an Animated.View that is a plain View.
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  const settle = (value: unknown) => value;
  const shared = (initial: unknown) => {
    let current = initial;
    return {
      get value() {
        return current;
      },
      set value(next: unknown) {
        current = next;
      },
      get: () => current,
      set: (next: unknown) => {
        current = next;
      },
      addListener: () => undefined,
      removeListener: () => undefined,
    };
  };
  return {
    __esModule: true,
    default: {
      View,
      Text: View,
      ScrollView: View,
      Image: View,
      // react-native-gesture-handler wraps its own views with this on import.
      createAnimatedComponent: (component: unknown) => component,
    },
    createAnimatedComponent: (component: unknown) => component,
    // Gesture handler builds its event plumbing from these.
    useEvent: () => () => undefined,
    useHandler: () => ({ context: {}, doDependenciesDiffer: false }),
    useAnimatedRef: () => ({ current: null }),
    useAnimatedReaction: () => undefined,
    useAnimatedGestureHandler: () => () => undefined,
    setGestureState: () => undefined,
    isSharedValue: () => false,
    makeMutable: shared,
    useSharedValue: shared,
    useAnimatedStyle: (fn: () => unknown) => {
      try {
        return fn();
      } catch {
        return {};
      }
    },
    useDerivedValue: (fn: () => unknown) => shared(fn()),
    cancelAnimation: () => undefined,
    withSpring: settle,
    withTiming: settle,
    withDelay: (_delay: number, value: unknown) => value,
    withRepeat: settle,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    interpolate: (value: number, input: number[], output: number[]) =>
      output[0] ?? value,
    Extrapolation: { CLAMP: 'clamp' },
    runOnJS:
      (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
    runOnUI:
      (fn: (...args: unknown[]) => unknown) =>
      (...args: unknown[]) =>
        fn(...args),
    LinearTransition: { duration: () => ({}) },
  };
});

// Screens read safe-area insets directly. Tests render them without a provider,
// so supply a zero inset frame rather than wrapping every test.
jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    ...actual,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

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
