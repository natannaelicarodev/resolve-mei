import { Redirect } from 'expo-router';

import { DesignSystemCatalog } from '@/features/design-system/DesignSystemCatalog';
import { isDesignSystemAvailable } from '@/features/design-system/access';

export default function DesignSystemRoute() {
  if (!isDesignSystemAvailable(__DEV__)) return <Redirect href="/" />;
  return <DesignSystemCatalog />;
}
