import { Redirect } from 'expo-router';
import { ScrollView } from 'react-native';

import { isDesignSystemAvailable } from '@/features/design-system/access';
import { HomeMockupScreen } from '@/features/home/HomeMockupScreen';
import type { HomeDashboardData } from '@/features/home/api';
import type { Quote } from '@/features/quotes/api';

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

const recentQuotes: Quote[] = [
  {
    id: 'quote-a',
    business_id: 'preview',
    client_id: 'client-a',
    quote_number: 4,
    status: 'approved',
    issued_on: '2026-08-26',
    valid_until: '2026-10-25',
    subtotal_cents: 820000,
    discount_cents: 0,
    total_cents: 820000,
    notes: null,
    client_name_snapshot: 'Luiz',
    client_document_snapshot: null,
    client_phone_snapshot: null,
    client_email_snapshot: null,
    created_at: '2026-08-26T12:00:00Z',
    updated_at: '2026-08-26T12:00:00Z',
  },
  {
    id: 'quote-b',
    business_id: 'preview',
    client_id: 'client-b',
    quote_number: 3,
    status: 'sent',
    issued_on: '2026-08-18',
    valid_until: '2026-10-17',
    subtotal_cents: 680000,
    discount_cents: 0,
    total_cents: 680000,
    notes: null,
    client_name_snapshot: 'Julia',
    client_document_snapshot: null,
    client_phone_snapshot: null,
    client_email_snapshot: null,
    created_at: '2026-08-18T12:00:00Z',
    updated_at: '2026-08-18T12:00:00Z',
  },
];

export default function DesignPreviewRoute() {
  if (!isDesignSystemAvailable(__DEV__)) return <Redirect href="/" />;
  return (
    <ScrollView>
      <HomeMockupScreen
        dashboard={dashboard}
        firstName="Natannael"
        onPeriodChange={() => undefined}
        period="6months"
        recentQuotes={recentQuotes}
      />
    </ScrollView>
  );
}
