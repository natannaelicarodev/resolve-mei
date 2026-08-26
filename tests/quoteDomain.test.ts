import {
  allowedQuoteTransitions,
  calculateItemTotal,
  calculateQuoteTotals,
  canEditQuote,
  canTransitionQuote,
  formatMoney,
  formatQuoteNumber,
  getDisplayQuoteStatus,
  moneyInputToCents,
} from '@/features/quotes/domain';
import { defaultQuoteValues, quoteSchema } from '@/features/quotes/schemas';

describe('quote money and totals', () => {
  it('calculates integer item totals, subtotal, discount and non-negative total', () => {
    expect(calculateItemTotal(3, 1250)).toBe(3750);
    expect(
      calculateQuoteTotals(
        [
          { quantity: 2, unitPriceCents: 1000 },
          { quantity: 1, unitPriceCents: 550 },
        ],
        300,
      ),
    ).toEqual({ subtotalCents: 2550, discountCents: 300, totalCents: 2250 });
    expect(
      calculateQuoteTotals([{ quantity: 1, unitPriceCents: 100 }], 999)
        .totalCents,
    ).toBe(0);
  });

  it('formats Brazilian money and readable quote numbers', () => {
    expect(moneyInputToCents('R$ 1.234,56')).toBe(123456);
    expect(formatMoney(123456)).toContain('1.234,56');
    expect(formatQuoteNumber(42)).toBe('000042');
  });
});

describe('quote status rules', () => {
  it('centralizes allowed transitions and editability', () => {
    expect(allowedQuoteTransitions.draft).toEqual(['sent', 'canceled']);
    expect(canTransitionQuote('sent', 'approved')).toBe(true);
    expect(canTransitionQuote('approved', 'draft')).toBe(false);
    expect(canEditQuote('draft')).toBe(true);
    expect(canEditQuote('approved')).toBe(false);
  });

  it('derives expired only for overdue sent quotes', () => {
    const today = new Date('2026-08-26T12:00:00Z');
    expect(getDisplayQuoteStatus('sent', '2026-08-25', today)).toBe('expired');
    expect(getDisplayQuoteStatus('approved', '2026-08-25', today)).toBe(
      'approved',
    );
  });
});

describe('quote form validation', () => {
  const valid = {
    ...defaultQuoteValues(),
    clientId: '11111111-1111-4111-8111-111111111111',
    validUntil: '01/01/2099',
    items: [
      {
        serviceId: null,
        name: 'Instalação',
        description: '',
        quantity: 1,
        unitPriceCents: 0,
      },
    ],
  };

  it('requires a client and at least one item while allowing zero price', () => {
    expect(quoteSchema.safeParse(valid).success).toBe(true);
    expect(quoteSchema.safeParse({ ...valid, clientId: '' }).success).toBe(
      false,
    );
    expect(quoteSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });

  it('rejects invalid quantity, past validity and excessive discount', () => {
    expect(
      quoteSchema.safeParse({
        ...valid,
        items: [{ ...valid.items[0], quantity: 0 }],
      }).success,
    ).toBe(false);
    expect(
      quoteSchema.safeParse({ ...valid, validUntil: '01/01/2020' }).success,
    ).toBe(false);
    expect(quoteSchema.safeParse({ ...valid, discountCents: 1 }).success).toBe(
      false,
    );
  });
});
