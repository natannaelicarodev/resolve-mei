import fs from 'node:fs';
import path from 'node:path';

import { supabase } from '@/lib/supabase';
import { saveQuote } from '@/features/quotes/api';
import {
  addDaysToDatabaseDate,
  formatDateForDisplay,
  getTodayDatabaseDate,
  isValidCalendarDate,
  maskDateInput,
  parseDateForDatabase,
} from '@/features/quotes/date';
import { quoteSchema } from '@/features/quotes/schemas';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn() } }));

describe('civil quote dates', () => {
  it.each([
    ['', ''],
    ['2', '2'],
    ['26', '26'],
    ['260', '26/0'],
    ['2608', '26/08'],
    ['26082', '26/08/2'],
    ['26082026', '26/08/2026'],
    ['26/08/2026', '26/08/2026'],
    ['26a08b2026', '26/08/2026'],
    ['260820261234', '26/08/2026'],
  ])('masks %s progressively as %s', (input, expected) => {
    expect(maskDateInput(input)).toBe(expected);
  });

  it('allows deletion without duplicating separators', () => {
    expect(maskDateInput('26/08/202')).toBe('26/08/202');
    expect(maskDateInput('26/08/20')).toBe('26/08/20');
    expect(maskDateInput('26/08')).toBe('26/08');
    expect(maskDateInput('26/0')).toBe('26/0');
  });

  it.each([
    ['31/02/2026', false],
    ['29/02/2025', false],
    ['29/02/2028', true],
    ['00/08/2026', false],
    ['26/13/2026', false],
    ['00/00/0000', false],
  ])('validates the real calendar date %s', (value, expected) => {
    expect(isValidCalendarDate(value)).toBe(expected);
  });

  it('converts database and display values without timezone parsing', () => {
    expect(formatDateForDisplay('2026-08-26')).toBe('26/08/2026');
    expect(formatDateForDisplay('2026-09-02')).toBe('02/09/2026');
    expect(parseDateForDatabase('26/08/2026')).toBe('2026-08-26');
    expect(parseDateForDatabase('31/02/2026')).toBeNull();
  });

  it('keeps date arithmetic civil across month boundaries', () => {
    expect(addDaysToDatabaseDate('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysToDatabaseDate('2028-02-29', 1)).toBe('2028-03-01');
    expect(getTodayDatabaseDate(new Date('2026-08-27T01:30:00Z'))).toBe(
      '2026-08-26',
    );
  });

  it('returns clear validation messages for incomplete, invalid and past dates', () => {
    const base = {
      clientId: '11111111-1111-4111-8111-111111111111',
      discountCents: 0,
      notes: '',
      items: [
        {
          serviceId: null,
          name: 'Serviço',
          description: '',
          quantity: 1,
          unitPriceCents: 0,
        },
      ],
    };
    expect(
      quoteSchema.safeParse({ ...base, validUntil: '26/08' }).error?.issues[0]
        ?.message,
    ).toBe('Informe a data completa.');
    expect(
      quoteSchema.safeParse({ ...base, validUntil: '31/02/2099' }).error
        ?.issues[0]?.message,
    ).toBe('Informe uma data válida.');
    expect(
      quoteSchema.safeParse({ ...base, validUntil: '01/01/2020' }).error
        ?.issues[0]?.message,
    ).toBe('A validade não pode ser anterior à data de emissão.');
  });
});

it('converts the masked validity before calling the database RPC', async () => {
  const returned = {
    id: 'quote-1',
    business_id: 'business-1',
    status: 'draft',
    items: [],
  };
  jest.mocked(supabase.rpc).mockResolvedValue({
    data: returned,
    error: null,
  } as never);
  await saveQuote(
    'business-1',
    {
      clientId: '11111111-1111-4111-8111-111111111111',
      validUntil: '26/09/2026',
      discountCents: 0,
      notes: '',
      items: [
        {
          serviceId: null,
          name: 'Serviço',
          description: '',
          quantity: 1,
          unitPriceCents: 0,
        },
      ],
    },
    'draft',
  );
  expect(supabase.rpc).toHaveBeenCalledWith(
    'save_quote',
    expect.objectContaining({ p_valid_until: '2026-09-26' }),
  );
});

it('configures the validity input for masked numeric entry', () => {
  const form = fs.readFileSync(
    path.join(process.cwd(), 'src/features/quotes/QuoteFormScreen.tsx'),
    'utf8',
  );
  expect(form).toContain('placeholder="DD/MM/AAAA"');
  expect(form).toContain('keyboardType="number-pad"');
  expect(form).toContain('maxLength={10}');
  expect(form).toContain('maskDateInput(value)');
  expect(form).toContain('formatDateForDisplay(quote.valid_until)');
});
