import { useCallback, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { BootIntroOverlay } from './BootIntroOverlay';

export function BootIntroGate({ children }: PropsWithChildren) {
  const [visible, setVisible] = useState(true);
  const complete = useCallback(() => setVisible(false), []);

  return (
    <View style={styles.container}>
      <View
        accessibilityElementsHidden={visible}
        importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}
        style={styles.container}
      >
        {children}
      </View>
      {visible ? <BootIntroOverlay onComplete={complete} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
