import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import { QuoteClientLinkSection } from '@/features/quotes/QuoteClientLinkSection';
import {
  getOwnerLinkState,
  issuePublicQuoteLink,
  revokePublicQuoteLink,
} from '@/features/quotes/publicLink';
import { ThemeProvider } from '@/theme';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
jest.mock('@/features/quotes/publicLink', () => ({
  buildPublicQuoteUrl: (token: string) =>
    `https://quotes.example/q#token=${token}`,
  getOwnerLinkState: jest.fn(),
  hasPublicQuoteBaseUrl: () => true,
  issuePublicQuoteLink: jest.fn(),
  revokePublicQuoteLink: jest.fn(),
}));

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } },
  });
  function TestProviders({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ThemeProvider>{children}</ThemeProvider>
      </QueryClientProvider>
    );
  }
  return TestProviders;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getOwnerLinkState).mockResolvedValue({ state: 'none' });
  jest.mocked(issuePublicQuoteLink).mockResolvedValue({
    expiresAt: '2026-09-07T12:00:00Z',
    quoteStatus: 'sent',
    state: 'active',
    token: 'a'.repeat(43),
    version: 1,
  });
  jest.mocked(revokePublicQuoteLink).mockResolvedValue({ state: 'revoked' });
  jest.mocked(Clipboard.setStringAsync).mockResolvedValue(true);
});

it('publishes a draft explicitly and keeps the raw token only in local UI state', async () => {
  const screen = await render(
    <QuoteClientLinkSection
      businessId="business-1"
      quoteId="quote-1"
      quoteStatus="draft"
      userId="user-1"
    />,
    { wrapper: wrapper() },
  );
  await screen.findByText('Ainda não disponibilizado');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Disponibilizar e gerar link' }),
  );
  expect(
    await screen.findByText(
      'O orçamento será marcado como enviado e esta versão ficará disponível ao cliente.',
    ),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Gerar link' }));
  await waitFor(() =>
    expect(issuePublicQuoteLink).toHaveBeenCalledWith('quote-1'),
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Copiar link' }),
  );
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
    `https://quotes.example/q#token=${'a'.repeat(43)}`,
  );
  await screen.unmount();
});

it('revokes an active link only after destructive confirmation', async () => {
  jest.mocked(getOwnerLinkState).mockResolvedValue({
    state: 'active',
    expiresAt: '2026-09-07T12:00:00Z',
    issuedAt: '2026-08-31T12:00:00Z',
    version: 2,
  });
  const screen = await render(
    <QuoteClientLinkSection
      businessId="business-1"
      quoteId="quote-1"
      quoteStatus="sent"
      userId="user-1"
    />,
    { wrapper: wrapper() },
  );
  await screen.findByText('Link ativo');
  await fireEvent.press(screen.getByRole('button', { name: 'Revogar acesso' }));
  expect(revokePublicQuoteLink).not.toHaveBeenCalled();
  const revokeButtons = screen.getAllByRole('button', {
    name: 'Revogar acesso',
  });
  await fireEvent.press(revokeButtons[revokeButtons.length - 1]!);
  await waitFor(() =>
    expect(revokePublicQuoteLink).toHaveBeenCalledWith('quote-1'),
  );
  expect(
    await screen.findByText('Acesso revogado imediatamente.'),
  ).toBeTruthy();
  await screen.unmount();
});
