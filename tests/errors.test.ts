import { normalizeError } from '@/lib/errors';

describe('normalizeError', () => {
  it('does not expose an unknown error detail', () => {
    expect(normalizeError(new Error('database password'))).toEqual({
      code: 'unknown',
      message: 'Ocorreu um erro inesperado. Tente novamente.',
    });
  });
});
