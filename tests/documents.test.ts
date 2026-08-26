import { digitsOnly, isValidCnpj, isValidCpf } from '@/utils/documents';

describe('Brazilian documents', () => {
  it('normalizes formatting characters', () => {
    expect(digitsOnly('123.456.789-09')).toBe('12345678909');
  });
  it('validates CPF check digits', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('529.982.247-24')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });
  it('validates CNPJ check digits', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
  });
});
