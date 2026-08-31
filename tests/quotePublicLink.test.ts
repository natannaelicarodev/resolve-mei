import { Platform } from 'react-native';

import {
  buildPublicQuoteUrl,
  ownerLinkStateSchema,
  publicQuoteResultSchema,
} from '@/features/quotes/publicLink';

const token = 'a'.repeat(43);

describe('public quote client contract', () => {
  it('places the secret only in the URL fragment', () => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { origin: 'https://local.example' },
    });
    const url = buildPublicQuoteUrl(token);
    expect(url).toBe(`https://local.example/q#token=${token}`);
    expect(url?.split('#')[0]).not.toContain(token);
    expect(url).not.toContain('?token=');
  });

  it('rejects private or unexpected fields in the public DTO', () => {
    const parsed = publicQuoteResultSchema.parse({
      state: 'available',
      expiresAt: '2026-09-07T12:00:00Z',
      quote: {
        provider: { businessName: 'MEI', phone: '11999999999' },
        client: { name: 'Cliente' },
        quoteNumber: 2,
        version: 1,
        issuedOn: '2026-08-31',
        validUntil: '2026-09-07',
        status: 'sent',
        items: [
          {
            name: 'Serviço',
            description: null,
            quantity: 1,
            unitPriceCents: 5000,
            totalCents: 5000,
          },
        ],
        subtotalCents: 5000,
        discountCents: 0,
        totalCents: 5000,
        owner_id: 'must-be-stripped',
      },
      token_hash: 'must-be-stripped',
    });
    expect(parsed).not.toHaveProperty('token_hash');
    expect(parsed.quote).not.toHaveProperty('owner_id');
  });

  it('models owner states without ever accepting a raw token', () => {
    const state = ownerLinkStateSchema.parse({
      state: 'responded',
      version: 3,
      expiresAt: '2026-09-07T12:00:00Z',
      token,
      decision: {
        value: 'approved',
        responderName: 'Maria',
        respondedAt: '2026-09-01T10:00:00Z',
        source: 'client_link',
      },
    });
    expect(state).not.toHaveProperty('token');
    expect(state.decision?.value).toBe('approved');
  });

  it('uses one generic unavailable state for invalid, expired or revoked links', () => {
    expect(publicQuoteResultSchema.parse({ state: 'unavailable' })).toEqual({
      state: 'unavailable',
    });
  });
});
