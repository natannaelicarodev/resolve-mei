import { Redirect, useLocalSearchParams } from 'expo-router';

import { DesignSystemCatalog } from '@/features/design-system/DesignSystemCatalog';
import { isDesignSystemAvailable } from '@/features/design-system/access';

export default function DesignSystemRoute() {
  const { theme } = useLocalSearchParams<{ theme?: 'light' | 'dark' }>();
  if (!isDesignSystemAvailable(__DEV__)) return <Redirect href="/" />;
  return <DesignSystemCatalog previewTheme={theme} />;
}
