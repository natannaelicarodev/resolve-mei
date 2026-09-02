import { Redirect } from 'expo-router';

import { DaylightHomeScreen } from '@/features/daylight/DaylightHomeScreen';

// Development-only harness that renders exactly what `/home` renders, against
// fixtures, so the screen can be inspected without a signed-in session.
export default function HomePreviewRoute() {
  if (!__DEV__) return <Redirect href="/home" />;
  return (
    <DaylightHomeScreen
      agendaActionCount={0}
      businessName="Elétrica Meireles"
      clientCount={28}
      firstName="Natannael"
      hasLogo
      recentQuotes={[
        {
          clientName: 'Amanda',
          id: 'preview-quote',
          quoteNumber: 4,
          status: 'rejected',
          updatedAt: new Date().toISOString(),
        },
      ]}
      reconnectCount={0}
      serviceCount={12}
    />
  );
}
