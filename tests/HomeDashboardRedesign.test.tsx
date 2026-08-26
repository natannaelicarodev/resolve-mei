import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { HomeDashboard } from '@/features/home/HomeDashboard';
import type { HomeDashboardData } from '@/features/home/api';

jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    AnimatedPressable: Pressable,
    FadeInView: View,
    useReducedMotion: () => true,
  };
});
jest.mock('@/lib/haptics', () => ({
  triggerHaptic: jest.fn().mockResolvedValue(undefined),
}));

const data: HomeDashboardData = {
  businessId: 'business-a',
  period: '6months',
  periodStart: '2026-03-01',
  periodEnd: '2026-09-01',
  approvedCents: 245000,
  previousApprovedCents: 200000,
  negotiatingCents: 128000,
  approvedCount: 6,
  openCount: 3,
  quoteCount: 9,
  monthly: [
    { month: '2026-03-01', approvedCents: 90000 },
    { month: '2026-04-01', approvedCents: 0 },
    { month: '2026-05-01', approvedCents: 55000 },
    { month: '2026-06-01', approvedCents: 100000 },
  ],
  clients: { total: 16, active: 12, inactive: 4 },
  services: [
    {
      serviceId: 'service-a',
      name: 'Consultoria financeira',
      quoteCount: 5,
      totalCents: 125000,
    },
  ],
};

function props(
  overrides: Partial<React.ComponentProps<typeof HomeDashboard>> = {},
) {
  return {
    dashboard: data,
    dashboardError: false,
    dashboardLoading: false,
    firstName: 'Lyara',
    hasContact: true,
    onPeriodChange: jest.fn(),
    onRetry: jest.fn(),
    period: '6months' as const,
    profileConfigured: true,
    ...overrides,
  };
}

it('keeps short and long greetings constrained while preserving settings', async () => {
  const short = await render(<HomeDashboard {...props({ firstName: 'Li' })} />);
  expect(short.getByText(/, Li$/).props.numberOfLines).toBe(1);
  await short.unmount();

  const long = await render(
    <HomeDashboard
      {...props({ firstName: 'Natannael com um nome muito extenso' })}
    />,
  );
  expect(
    long.getByText(/Natannael com um nome muito extenso/).props.numberOfLines,
  ).toBe(1);
  expect(
    long.getByText('Veja como está o seu negócio hoje.').props.numberOfLines,
  ).toBe(2);
  expect(long.getByLabelText('Abrir configurações')).toBeTruthy();
  await long.unmount();
});

it('renders real balance, comparison, clients and most quoted services', async () => {
  const screen = await render(<HomeDashboard {...props()} />);
  expect(screen.getAllByText('R$ 2.450,00').length).toBeGreaterThan(0);
  expect(
    screen.getByText('Aumento de 23% em relação ao período anterior'),
  ).toBeTruthy();
  expect(screen.getByText('75%')).toBeTruthy();
  expect(screen.getByText('12 ativos')).toBeTruthy();
  expect(screen.getByText('Consultoria financeira')).toBeTruthy();
  expect(
    screen.getByText(
      'Baseado nos itens adicionados aos orçamentos do período.',
    ),
  ).toBeTruthy();
  await screen.unmount();
});

it('renders structural skeletons without invented zero values', async () => {
  const screen = await render(
    <HomeDashboard
      {...props({ dashboard: undefined, dashboardLoading: true })}
    />,
  );
  expect(screen.getByTestId('balance-skeleton')).toBeTruthy();
  expect(screen.getByTestId('overview-skeleton')).toBeTruthy();
  expect(screen.getByTestId('clients-skeleton')).toBeTruthy();
  expect(screen.getByTestId('services-skeleton')).toBeTruthy();
  expect(screen.queryByText('R$ 0,00')).toBeNull();
  await screen.unmount();
});

it('shows independent unavailable states and retries the aggregate query', async () => {
  const onRetry = jest.fn();
  const screen = await render(
    <HomeDashboard
      {...props({ dashboard: undefined, dashboardError: true, onRetry })}
    />,
  );
  expect(screen.getAllByText('Indisponível')).toHaveLength(4);
  await act(async () => {
    fireEvent.press(screen.getAllByText('Tentar novamente')[0]!);
  });
  expect(onRetry).toHaveBeenCalledTimes(1);
  await screen.unmount();
});

it('explains empty quotes, clients and services without fictitious metrics', async () => {
  const empty: HomeDashboardData = {
    ...data,
    approvedCents: 0,
    previousApprovedCents: 0,
    negotiatingCents: 0,
    approvedCount: 0,
    openCount: 0,
    quoteCount: 0,
    monthly: [{ month: '2026-08-01', approvedCents: 0 }],
    clients: { total: 0, active: 0, inactive: 0 },
    services: [],
  };
  const screen = await render(
    <HomeDashboard {...props({ dashboard: empty })} />,
  );
  expect(
    screen.getByText('Nenhum orçamento aprovado neste período'),
  ).toBeTruthy();
  expect(
    screen.getByText(
      'Seus clientes aparecerão aqui conforme você cadastrá-los.',
    ),
  ).toBeTruthy();
  expect(
    screen.getByText(
      'Ainda não há serviços adicionados a orçamentos neste período.',
    ),
  ).toBeTruthy();
  await screen.unmount();
});

it('changes the dashboard period and exposes monthly values on interaction', async () => {
  const onPeriodChange = jest.fn();
  const screen = await render(<HomeDashboard {...props({ onPeriodChange })} />);
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Período: Últimos 6 meses'));
  });
  await act(async () => {
    fireEvent.press(screen.getByText('Este ano'));
  });
  expect(onPeriodChange).toHaveBeenCalledWith('year');
  await act(async () => {
    fireEvent.press(screen.getByLabelText('Jun, R$ 1.000,00'));
  });
  await waitFor(() =>
    expect(screen.getByText('Jun: R$ 1.000,00')).toBeTruthy(),
  );
  await screen.unmount();
});

it('keeps long currency values complete and allows native font fitting', async () => {
  const longValue = 99999999999;
  const screen = await render(
    <HomeDashboard
      {...props({
        dashboard: {
          ...data,
          approvedCents: longValue,
          negotiatingCents: longValue,
        },
      })}
    />,
  );
  const approvedValue = screen
    .getAllByLabelText('Valor aprovado: R$ 999.999.999,99')
    .find((element) => element.props.adjustsFontSizeToFit);
  expect(approvedValue).toBeDefined();
  expect(approvedValue?.props.adjustsFontSizeToFit).toBe(true);
  expect(approvedValue?.props.numberOfLines).toBe(1);
  expect(screen.getAllByText('R$ 999.999.999,99')).toHaveLength(3);
  await screen.unmount();
});

it('shows a compact one-month chart with its value without interaction', async () => {
  const screen = await render(
    <HomeDashboard
      {...props({
        dashboard: {
          ...data,
          monthly: [{ month: '2026-08-01', approvedCents: 245000 }],
        },
      })}
    />,
  );
  expect(screen.getByText('Ago: R$ 2.450,00')).toBeTruthy();
  expect(screen.getByLabelText('Ago, R$ 2.450,00')).toBeTruthy();
  await screen.unmount();
});

it('handles an empty monthly series and exposes all quick actions', async () => {
  const screen = await render(
    <HomeDashboard
      {...props({ dashboard: { ...data, monthly: [], approvedCents: 0 } })}
    />,
  );
  expect(
    screen.getByText('Ainda não há orçamentos aprovados neste período.'),
  ).toBeTruthy();
  expect(screen.getByLabelText('Novo orçamento')).toBeTruthy();
  expect(screen.getByLabelText('Novo cliente')).toBeTruthy();
  expect(screen.getByLabelText('Novo serviço')).toBeTruthy();
  await screen.unmount();
});
