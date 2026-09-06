import { createContext, useCallback, useContext, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { BootIntroOverlay } from './BootIntroOverlay';

const BootDestinationReadyContext = createContext<() => void>(() => undefined);

export function useBootDestinationReady() {
  return useContext(BootDestinationReadyContext);
}

export function BootIntroGate({ children }: PropsWithChildren) {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [destinationReady, setDestinationReady] = useState(false);
  const visible = !animationComplete || !destinationReady;
  const completeAnimation = useCallback(() => setAnimationComplete(true), []);
  const markDestinationReady = useCallback(() => {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setDestinationReady(true)),
    );
  }, []);

  return (
    <BootDestinationReadyContext.Provider value={markDestinationReady}>
      <View style={styles.container}>
        <View
          accessibilityElementsHidden={visible}
          importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}
          style={styles.container}
        >
          {children}
        </View>
        {visible ? <BootIntroOverlay onComplete={completeAnimation} /> : null}
      </View>
    </BootDestinationReadyContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
