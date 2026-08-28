import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { isDesignSystemAvailable } from '@/features/design-system/access';
import type { Client } from '@/features/clients/api';
import { ClientListScreen } from '@/features/clients/ClientListScreen';
import { clientsQueryKey } from '@/features/clients/hooks';
import { HomeMockupScreen } from '@/features/home/HomeMockupScreen';
import type { HomeDashboardData } from '@/features/home/api';
import type { Quote } from '@/features/quotes/api';
import { AuthContext } from '@/providers/AuthProvider';
import type { AuthContextValue } from '@/providers/AuthProvider';
import { LightThemeScope } from '@/theme';

// Development-only visual harness for reviewing redesigned screens against
// fixed data, without a real session. Guarded by the same __DEV__ check as the
// design-system catalog, so it redirects away in a production build.
// Presentational screens (HomeMockupScreen) render straight from fixture
// props. Screens that fetch internally (ClientListScreen) get a fixture auth
// value and a pre-seeded, refetch-disabled query cache scoped to just that
// subtree, so no real Supabase call or session is ever touched here either.
const dashboard: HomeDashboardData = {
  businessId: 'preview',
  period: '6months',
  periodStart: '2026-03-01',
  periodEnd: '2026-09-01',
  approvedCents: 1500000,
  previousApprovedCents: 1339000,
  previousApprovedCount: 2,
  previousQuoteCount: 3,
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

const PREVIEW_USER_ID = 'preview-user';
const PREVIEW_BUSINESS_ID = 'preview-business';

const previewClients: Client[] = [
  {
    id: 'preview-client-1',
    business_id: PREVIEW_BUSINESS_ID,
    type: 'person',
    name: 'Julia Fernandes',
    document: null,
    phone: '85998412210',
    email: null,
    notes: null,
    status: 'active',
    created_at: '2026-08-01T12:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
  },
  {
    id: 'preview-client-2',
    business_id: PREVIEW_BUSINESS_ID,
    type: 'person',
    name: 'Luiz Andrade',
    document: null,
    phone: null,
    email: null,
    notes: null,
    status: 'inactive',
    created_at: '2026-07-15T12:00:00Z',
    updated_at: '2026-07-15T12:00:00Z',
  },
  {
    id: 'preview-client-3',
    business_id: PREVIEW_BUSINESS_ID,
    type: 'person',
    name: 'Marcos Vinícius',
    document: null,
    phone: null,
    email: 'marcos.v@email.com',
    notes: null,
    status: 'active',
    created_at: '2026-08-08T12:00:00Z',
    updated_at: '2026-08-08T12:00:00Z',
  },
];

// A dedicated, pre-seeded query cache plus a fixture auth value shadow the
// real providers from AppProviders for this subtree only, so the preview
// never issues a real Supabase call or touches the real session.
const previewQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  },
});
previewQueryClient.setQueryData(
  [
    ...clientsQueryKey(PREVIEW_USER_ID, PREVIEW_BUSINESS_ID),
    'list',
    '',
    'all',
    0,
  ],
  previewClients,
);

const previewAuthValue: AuthContextValue = {
  session: null,
  user: { id: PREVIEW_USER_ID } as unknown as User,
  isLoading: false,
  isPasswordRecovery: false,
  clearPasswordRecovery: () => undefined,
  beginPasswordRecovery: () => undefined,
  signOut: async () => undefined,
};

function ClientsPreview({ theme }: { theme: 'dark' | 'light' }) {
  const [client] = useState(() => previewQueryClient);
  const list = (
    <AuthContext.Provider value={previewAuthValue}>
      <QueryClientProvider client={client}>
        <View style={{ height: 900 }}>
          <ClientListScreen businessId={PREVIEW_BUSINESS_ID} />
        </View>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
  return theme === 'light' ? <LightThemeScope>{list}</LightThemeScope> : list;
}

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
      <ClientsPreview theme="dark" />
      <ClientsPreview theme="light" />
    </ScrollView>
  );
}
