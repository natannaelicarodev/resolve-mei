import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function ServicesLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    />
  );
}
