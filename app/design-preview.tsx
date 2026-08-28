import { Redirect } from 'expo-router';
import { ScrollView } from 'react-native';

import { isDesignSystemAvailable } from '@/features/design-system/access';
import { HomeDashboard } from '@/features/home/HomeDashboard';
import type { HomeDashboardData } from '@/features/home/api';

// Development-only visual harness for reviewing redesigned screens against
// fixed data, without a real session. Guarded by the same __DEV__ check as the
// design-system catalog, so it redirects away in a production build. It renders
// presentational components only and touches no auth, guard or query code.
const dashboard: HomeDashboardData = {
  businessId: 'preview',
  period: '6months',
  periodStart: '2026-03-01',
  periodEnd: '2026-09-01',
  approvedCents: 1500000,
  previousApprovedCents: 1339000,
  negotiatingCents: 480000,
  approvedCount: 6,
  openCount: 3,
  quoteCount: 9,
  monthly: [
    { month: '2026-03-01', approvedCents: 900000 },
    { month: '2026-04-01', approvedCents: 420000 },
    { month: '2026-05-01', approvedCents: 1250000 },
    { month: '2026-06-01', approvedCents: 1500000 },
  ],
  clients: { total: 16, active: 12, inactive: 4 },
  services: [
    {
      serviceId: 'service-a',
      name: 'Instalação elétrica residencial',
      quoteCount: 5,
      totalCents: 620000,
    },
    {
      serviceId: 'service-b',
      name: 'Manutenção preventiva',
      quoteCount: 3,
      totalCents: 310000,
    },
  ],
};

export default function DesignPreviewRoute() {
  if (!isDesignSystemAvailable(__DEV__)) return <Redirect href="/" />;
  return (
    <ScrollView>
      <HomeDashboard
        dashboard={dashboard}
        firstName="Natannael"
        hasContact
        period="6months"
        profileConfigured
      />
    </ScrollView>
  );
}
