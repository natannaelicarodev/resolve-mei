import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PublicQuoteScreen } from '@/features/quotes/PublicQuoteScreen';
import {
  resolvePublicQuote,
  respondPublicQuote,
} from '@/features/quotes/publicLink';
import { ThemeProvider } from '@/theme';

jest.mock('@/features/quotes/publicLink', () => ({
  getPublicQuoteErrorCode: jest.fn(() => 'PUBLIC-NETWORK'),
  resolvePublicQuote: jest.fn(),
  respondPublicQuote: jest.fn(),
}));

const token = 'a'.repeat(43);
const available = {
  state: 'available' as const,
  expiresAt: '2026-09-07T12:00:00Z',
  quote: {
    provider: { businessName: 'Resolve Serviços', phone: '11999999999' },
    client: { name: '<script>Cliente</script>' },
    quoteNumber: 2,
    version: 1,
    issuedOn: '2026-08-31',
    validUntil: '2026-09-07',
    status: 'sent' as const,
    items: [
      {
        name: 'Instalação profissional',
        description: '<img src=x onerror=alert(1)>',
        quantity: 2,
        unitPriceCents: 5000,
        totalCents: 10000,
      },
    ],
    subtotalCents: 10000,
    discountCents: 0,
    totalCents: 10000,
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { hash: `#token=${token}` },
  });
  jest.mocked(resolvePublicQuote).mockResolvedValue(available);
});

it('renders the explicit public DTO as text without private navigation', async () => {
  const screen = await render(
    <ThemeProvider>
      <PublicQuoteScreen />
    </ThemeProvider>,
  );
  expect(await screen.findByText('Resolve Serviços')).toBeTruthy();
  expect(screen.getByText(/<script>Cliente<\/script>/)).toBeTruthy();
  expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeTruthy();
  expect(screen.getAllByText(/100,00/).length).toBeGreaterThan(0);
  expect(screen.queryByText('Início')).toBeNull();
  expect(resolvePublicQuote).toHaveBeenCalledWith(token);
  await screen.unmount();
});

it('requires explicit confirmation and submits one final approval', async () => {
  jest.mocked(respondPublicQuote).mockResolvedValue({
    state: 'responded',
    decision: 'approved',
    responderName: 'Maria Cliente',
    respondedAt: '2026-09-01T10:00:00Z',
  });
  jest
    .mocked(resolvePublicQuote)
    .mockResolvedValueOnce(available)
    .mockResolvedValueOnce({
      ...available,
      state: 'responded',
      decision: {
        value: 'approved',
        responderName: 'Maria Cliente',
        respondedAt: '2026-09-01T10:00:00Z',
      },
    });
  const screen = await render(
    <ThemeProvider>
      <PublicQuoteScreen />
    </ThemeProvider>,
  );
  await screen.findByText('Responder orçamento');
  await fireEvent.changeText(
    screen.getByLabelText('Seu nome'),
    '  Maria   Cliente ',
  );
  await fireEvent.press(screen.getByRole('checkbox'));
  await fireEvent.press(
    screen.getByRole('button', { name: 'Revisar aprovação' }),
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Aprovar orçamento' }),
  );
  await waitFor(() =>
    expect(respondPublicQuote).toHaveBeenCalledWith({
      decision: 'approved',
      name: 'Maria Cliente',
      reason: '',
      token,
    }),
  );
  expect(
    await screen.findByText('A aprovação deste orçamento já foi registrada.'),
  ).toBeTruthy();
  await screen.unmount();
});

it('shows the same unavailable state without revealing why', async () => {
  jest.mocked(resolvePublicQuote).mockResolvedValue({ state: 'unavailable' });
  const screen = await render(
    <ThemeProvider>
      <PublicQuoteScreen />
    </ThemeProvider>,
  );
  expect(
    await screen.findByText(
      'Este link não está disponível. Ele pode ter expirado, sido revogado ou substituído.',
    ),
  ).toBeTruthy();
  await screen.unmount();
});
