import { normalizeError } from '@/lib/errors';

describe('normalizeError', () => {
  it('identifies a pending onboarding database migration', () => {
    expect(normalizeError({ code: 'onboarding_migration_required' })).toEqual({
      code: 'storage',
      message:
        'Atualização do sistema pendente. Aplique a migração do onboarding e tente novamente.',
    });
  });

  it('does not expose an unknown error detail', () => {
    expect(normalizeError(new Error('database password'))).toEqual({
      code: 'unknown',
      message: 'Ocorreu um erro inesperado. Tente novamente.',
    });
  });
});
