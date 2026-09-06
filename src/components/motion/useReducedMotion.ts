import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { AccessibilityInfo } from 'react-native';

interface ReducedMotionPreference {
  preferenceReady: boolean;
  reducedMotion: boolean;
}

const ReducedMotionContext = createContext<ReducedMotionPreference>({
  preferenceReady: false,
  reducedMotion: false,
});

export function ReducedMotionProvider({ children }: PropsWithChildren) {
  const [preference, setPreference] = useState<ReducedMotionPreference>({
    preferenceReady: false,
    reducedMotion: false,
  });

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) {
          setPreference({ preferenceReady: true, reducedMotion: value });
        }
      })
      .catch(() => {
        if (mounted) {
          setPreference({ preferenceReady: true, reducedMotion: true });
        }
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value) => setPreference({ preferenceReady: true, reducedMotion: value }),
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return createElement(
    ReducedMotionContext.Provider,
    { value: preference },
    children,
  );
}

export function useReducedMotion(): boolean {
  return useContext(ReducedMotionContext).reducedMotion;
}

export function useReducedMotionPreference(): ReducedMotionPreference {
  return useContext(ReducedMotionContext);
}
