import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { AccessibilityInfo } from 'react-native';

const ReducedMotionContext = createContext(false);

export function ReducedMotionProvider({ children }: PropsWithChildren) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return createElement(
    ReducedMotionContext.Provider,
    { value: reduced },
    children,
  );
}

export function useReducedMotion(): boolean {
  return useContext(ReducedMotionContext);
}
