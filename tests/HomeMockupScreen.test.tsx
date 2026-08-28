import { fireEvent, render, waitFor } from '@testing-library/react-native';

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
  services: [
    {
      serviceId: 'service-1',
      name: 'Instalação residencial',
      quoteCount: 6,
      totalCents: 900000,
    },
    {
      serviceId: 'service-2',
      name: 'Manutenção preventiva',
      quoteCount: 4,
      totalCents: 420000,
    },
    {
      serviceId: 'service-3',
      name: 'Reparo emergencial',
      quoteCount: 2,
      totalCents: 180000,
    },
  ],
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
  expect(
    screen.getByLabelText('Gráfico do valor aprovado nos últimos 6 meses'),
  ).toBeTruthy();
  expect(screen.getByLabelText('Ocultar valores')).toBeTruthy();
  expect(screen.getByText('Ago 2026')).toBeTruthy();
  expect(screen.getByTestId('service-percentage-0')).toBeTruthy();
  expect(screen.getByTestId('service-percentage-1')).toBeTruthy();
  expect(screen.getByTestId('service-percentage-2')).toBeTruthy();
  expect(screen.queryByText('60%')).toBeNull();
  fireEvent(screen.getByTestId('service-revenue-visibility'), 'layout', {
    nativeEvent: { layout: { height: 132, width: 320, x: 0, y: 2000 } },
  });
  fireEvent(screen.getByTestId('service-ranking-visibility'), 'layout', {
    nativeEvent: { layout: { height: 142, width: 320, x: 0, y: 2200 } },
  });
  fireEvent.scroll(screen.getByTestId('home-scroll'), {
    nativeEvent: { contentOffset: { x: 0, y: 2000 } },
  });
  await waitFor(() => expect(screen.getByText('60%')).toBeTruthy());
  expect(screen.getByText('Ações rápidas')).toBeTruthy();
  expect(screen.getByText('Ticket médio')).toBeTruthy();
  expect(screen.getByText('Taxa de aprovação')).toBeTruthy();
  expect(screen.getByText('+12%')).toBeTruthy();
  expect(screen.getByText('+0%')).toBeTruthy();
  expect(screen.getByText('Faturamento')).toBeTruthy();
  expect(screen.getByText('Receita por serviço')).toBeTruthy();
  expect(screen.getByText('Serviços mais orçados')).toBeTruthy();
  expect(screen.getByText('Últimos orçamentos aprovados')).toBeTruthy();
  expect(screen.getByTestId('quick-action-icon-/quotes/new').props.name).toBe(
    'file-document-plus-outline',
  );
  expect(screen.getByTestId('quick-action-icon-/clients/new').props.name).toBe(
    'account-plus-outline',
  );
  expect(screen.getByTestId('quick-action-icon-/services/new').props.name).toBe(
    'briefcase-plus-outline',
  );
  expect(screen.queryAllByText('+')).toHaveLength(0);
  expect(screen.queryByText('Visão geral')).toBeNull();
  await screen.unmount();
});
