import {
  formatDuration,
  formatPriceCents,
  formatPriceInput,
  parsePriceInput,
} from '@/features/services/format';
import { escapeServiceSearchPattern } from '@/features/services/api';
import {
  normalizeServiceInput,
  serviceSchema,
} from '@/features/services/schemas';

describe('service domain', () => {
  it('escapes ILIKE wildcards and removes PostgREST separators', () => {
    expect(escapeServiceSearchPattern('  taxa_10%, teste  ')).toBe(
      'taxa\\_10\\% teste',
    );
    expect(escapeServiceSearchPattern('a\\b')).toBe('a\\\\b');
  });

  it.each([
    ['1', 'R$ 0,01', 1],
    ['100', 'R$ 1,00', 100],
    ['15000', 'R$ 150,00', 15000],
  ])('formats progressive price %s safely', (input, formatted, cents) => {
    expect(formatPriceInput(input)).toBe(formatted);
    expect(parsePriceInput(formatted)).toBe(cents);
  });

  it('accepts zero and rejects negative or empty prices', () => {
    expect(parsePriceInput('R$ 0,00')).toBe(0);
    expect(parsePriceInput('-1')).toBeNull();
    expect(parsePriceInput('')).toBeNull();
    expect(formatPriceCents(0)).toBe('R$ 0,00');
  });

  it.each([
    [30, '30 min'],
    [60, '1 h'],
    [90, '1 h 30 min'],
    [null, null],
  ])('formats duration %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  it('trims and normalizes without an ownership field', () => {
    const input = serviceSchema.parse({
      name: '  Corte  ',
      description: '  Completo  ',
      price: 'R$ 25,00',
      estimatedDurationMinutes: '',
      status: 'active',
    });
    expect(normalizeServiceInput(input)).toEqual({
      name: 'Corte',
      description: 'Completo',
      price_cents: 2500,
      estimated_duration_minutes: null,
      status: 'active',
    });
    expect(normalizeServiceInput(input)).not.toHaveProperty('business_id');
  });

  it('rejects blank names and invalid durations', () => {
    const base = {
      name: 'Serviço',
      description: '',
      price: 'R$ 0,00',
      status: 'active',
    };
    expect(
      serviceSchema.safeParse({
        ...base,
        name: ' ',
        estimatedDurationMinutes: '',
      }).success,
    ).toBe(false);
    expect(
      serviceSchema.safeParse({ ...base, estimatedDurationMinutes: '0' })
        .success,
    ).toBe(false);
  });
});
