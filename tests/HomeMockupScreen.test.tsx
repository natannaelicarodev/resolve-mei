import { render } from '@testing-library/react-native';

import { HomeMockupScreen } from '@/features/home/HomeMockupScreen';
import type { HomeDashboardData } from '@/features/home/api';

jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    AnimatedPressable: Pressable,
    FadeInView: View,
    useReducedMotion: () => true,
  };
});
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => {
  const { View } = jest.requireActual('react-native');
  return { __esModule: true, default: View };
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
  previousApprovedCount: 2,
  previousQuoteCount: 3,
  negotiatingCents: 835000,
  approvedCount: 2,
  openCount: 1,
  quoteCount: 3,
  monthly: [],
  clients: { total: 2, active: 2, inactive: 0 },
  services: [],
};

it('renders the approved decision-focused home hierarchy', async () => {
  const screen = await render(
    <HomeMockupScreen
      dashboard={dashboard}
      firstName="Natannael"
      onPeriodChange={jest.fn()}
      period="6months"
      recentQuotes={[]}
    />,
  );

  expect(screen.getByText(/Natannael\.$/)).toBeTruthy();
  expect(screen.getByText('EM NEGOCIAÇÃO')).toBeTruthy();
  expect(screen.getByText('Valor dos orçamentos enviados')).toBeTruthy();
  expect(
    screen.getByLabelText(/Em negociação:.*8\.350,00/),
  ).toBeTruthy();
  expect(screen.getByText('Ver todos')).toBeTruthy();
  expect(screen.getByText('Novo orçamento')).toBeTruthy();
  expect(screen.queryByText('Balanço estimado')).toBeNull();
  await screen.unmount();
});
