import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './Text';

export function StatusLed({ active }: { active: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Status: ${active ? 'Ativo' : 'Inativo'}`}
      style={styles.row}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.led,
          {
            backgroundColor: active ? colors.success : colors.textMuted,
            ...(active ? { boxShadow: `0 0 6px ${colors.success}` } : null),
          },
        ]}
      />
      <Text
        color={active ? 'success' : 'textMuted'}
        style={styles.text}
        variant="status"
      >
        {active ? 'Ativo' : 'Inativo'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  led: { borderRadius: 2, height: 7, width: 7 },
  text: { fontSize: 9, lineHeight: 12 },
});
