import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { HomeDashboard } from '@/features/home/HomeDashboard';
import type { HomeDashboardData } from '@/features/home/api';

jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return { AnimatedPressable: Pressable, FadeInView: View };
});

export const dashboardFixture: HomeDashboardData = {
  businessId: 'business-1',
  period: 'month',
  periodStart: '2026-08-01',
  periodEnd: '2026-09-01',
  approvedCents: 150000,
  previousApprovedCents: 100000,
  previousApprovedCount: 1,
  previousQuoteCount: 1,
  negotiatingCents: 50000,
  approvedCount: 2,
  openCount: 1,
  quoteCount: 3,
  monthly: [{ month: '2026-08-01', approvedCents: 150000 }],
  clients: { total: 3, active: 2, inactive: 1 },
  services: [
    {
      serviceId: 'service-1',
      name: 'Consultoria',
      quoteCount: 2,
      totalCents: 80000,
    },
  ],
};

it('renders real dashboard sections and opens quick actions', async () => {
  const screen = await render(
    <HomeDashboard
      dashboard={dashboardFixture}
      dashboardError={false}
      dashboardLoading={false}
      firstName="Ana"
      hasContact
      onPeriodChange={jest.fn()}
      onRetry={jest.fn()}
      period="month"
      profileConfigured
    />,
  );
  fireEvent.press(screen.getByLabelText('Novo serviço'));
  expect(router.push).toHaveBeenLastCalledWith('/services/new');
  fireEvent.press(screen.getByLabelText('Novo orçamento'));
  expect(router.push).toHaveBeenLastCalledWith('/quotes/new');
  expect(screen.getByText('Serviços mais orçados')).toBeTruthy();
  expect(screen.getByText('Consultoria')).toBeTruthy();
  expect(screen.getByText('67%')).toBeTruthy();
  await screen.unmount();
});
