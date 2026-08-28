import { render } from '@testing-library/react-native';

import { HomeMockupScreen } from '@/features/home/HomeMockupScreen';
import type { HomeDashboardData } from '@/features/home/api';

jest.mock('@/components/motion', () => {
  const { Pressable } = jest.requireActual('react-native');
  return { AnimatedPressable: Pressable };
});
jest.mock('@/lib/haptics', () => ({
  triggerHaptic: jest.fn().mockResolvedValue(undefined),
}));

const dashboard: HomeDashboardData = {
  businessId: 'business-a',
  period: '6months',
  periodStart: '2026-03-01',
  periodEnd: '2026-09-01',
  approvedCents: 1500000,
  previousApprovedCents: 1339000,
  negotiatingCents: 0,
  approvedCount: 2,
  openCount: 1,
  quoteCount: 3,
  monthly: [
    { month: '2026-03-01', approvedCents: 900000 },
    { month: '2026-04-01', approvedCents: 420000 },
    { month: '2026-05-01', approvedCents: 1250000 },
    { month: '2026-06-01', approvedCents: 1500000 },
  ],
  clients: { total: 2, active: 2, inactive: 0 },
  services: [],
};

it('follows the mockup hierarchy without the former overview blocks', async () => {
  const screen = await render(
    <HomeMockupScreen
      dashboard={dashboard}
      firstName="Natannael"
      onPeriodChange={jest.fn()}
      period="6months"
      recentQuotes={[]}
    />,
  );

  expect(screen.getByTestId('mockup-balance-card')).toBeTruthy();
  expect(screen.getByTestId('mockup-composition-card')).toBeTruthy();
  expect(screen.getByText('Valor aprovado nos últimos 6 meses')).toBeTruthy();
  expect(screen.getByText('Ações rápidas')).toBeTruthy();
  expect(screen.getByText('Orçamentos recentes')).toBeTruthy();
  expect(screen.queryByText('Visão geral')).toBeNull();
  expect(screen.queryByText('Serviços mais orçados')).toBeNull();
  await screen.unmount();
});
