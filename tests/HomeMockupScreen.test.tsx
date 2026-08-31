import { fireEvent, render } from '@testing-library/react-native';

import { HomeMockupScreen } from '@/features/home/HomeMockupScreen';
import type { HomeDashboardData } from '@/features/home/api';
import type { Quote } from '@/features/quotes/api';

// The real AnimatedPressable is kept so presses go through the same Pressable
// the app ships; only the reduced-motion probe is stubbed, to pin animations to
// their final state.
jest.mock('@/components/motion', () => ({
  ...jest.requireActual('@/components/motion'),
  useReducedMotion: () => true,
}));
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

function quote(overrides: Partial<Quote>): Quote {
  return {
    id: 'quote-1',
    business_id: 'business-a',
    client_id: 'client-1',
    client_name_snapshot: 'Marina Duarte',
    client_document_snapshot: null,
    client_phone_snapshot: null,
    client_email_snapshot: null,
    quote_number: 102,
    status: 'sent',
    issued_on: '2026-08-20',
    valid_until: '2099-01-01',
    total_cents: 420000,
    subtotal_cents: 420000,
    discount_cents: 0,
    notes: null,
    created_at: '2026-08-20T12:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
    ...overrides,
  };
}

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
  expect(screen.getByLabelText(/Em negociação:.*8\.350,00/)).toBeTruthy();
  expect(screen.getByText('Ver todos')).toBeTruthy();
  expect(screen.getByText('Novo orçamento')).toBeTruthy();
  expect(screen.queryByText('Balanço estimado')).toBeNull();
  await screen.unmount();
});

it('leads the rail with the quote that costs most to ignore', async () => {
  const screen = await render(
    <HomeMockupScreen
      dashboard={dashboard}
      onPeriodChange={jest.fn()}
      period="6months"
      recentQuotes={[
        quote({ id: 'draft', status: 'draft', total_cents: 900000 }),
        quote({
          id: 'expired',
          client_name_snapshot: 'Condomínio Aurora',
          valid_until: '2020-01-01',
          total_cents: 128000,
        }),
      ]}
    />,
  );

  expect(screen.getByText('Onde o dinheiro parou')).toBeTruthy();
  // Expired outranks the larger draft: the money is already leaking.
  expect(screen.getByText('Vencido')).toBeTruthy();
  expect(screen.getByText('Condomínio Aurora')).toBeTruthy();
  expect(screen.getByText('Cobrar resposta')).toBeTruthy();
  await screen.unmount();
});

it('states that the lifecycle stops at approved instead of faking later stages', async () => {
  const screen = await render(
    <HomeMockupScreen
      dashboard={dashboard}
      onPeriodChange={jest.fn()}
      period="6months"
      recentQuotes={[quote({})]}
    />,
  );

  expect(screen.getByText(/o ciclo termina em/i)).toBeTruthy();
  expect(
    screen.getByLabelText('Agendado: etapa ainda não disponível no app'),
  ).toBeTruthy();
  expect(
    screen.getByLabelText('Recebido: etapa ainda não disponível no app'),
  ).toBeTruthy();
  await screen.unmount();
});

it('filters the rail by stage and clears the filter on a second press', async () => {
  const screen = await render(
    <HomeMockupScreen
      dashboard={dashboard}
      onPeriodChange={jest.fn()}
      period="6months"
      recentQuotes={[
        quote({ id: 'sent', client_name_snapshot: 'Marina Duarte' }),
        quote({
          id: 'draft',
          client_name_snapshot: 'Studio Lã',
          status: 'draft',
        }),
      ]}
    />,
  );

  const sentTab = () =>
    screen.getByRole('tab', {
      name: 'Enviado, aguardando resposta: 1 serviço',
    });

  expect(screen.getByText('Studio Lã')).toBeTruthy();
  await fireEvent.press(sentTab());
  expect(screen.getByText('Filtrado por etapa')).toBeTruthy();
  expect(screen.queryByText('Studio Lã')).toBeNull();
  await fireEvent.press(sentTab());
  expect(screen.getByText('Studio Lã')).toBeTruthy();
  await screen.unmount();
});

it('treats an empty rail as good news rather than an error', async () => {
  const screen = await render(
    <HomeMockupScreen
      dashboard={dashboard}
      onPeriodChange={jest.fn()}
      period="6months"
      recentQuotes={[quote({ status: 'rejected' })]}
    />,
  );

  expect(screen.getByText('Nada parado agora')).toBeTruthy();
  await screen.unmount();
});
