import {
  businessSchema,
  normalizeBusinessInput,
} from '@/features/business/schemas';

const validBusiness = {
  businessName: 'Ana Servicos',
  documentType: 'cpf' as const,
  documentNumber: '529.982.247-25',
  professionalPhone: '(11) 99999-9999',
  email: 'ANA@EXAMPLE.COM',
  street: 'Rua Um',
  number: '10',
  complement: '',
  neighborhood: 'Centro',
  city: 'Sao Paulo',
  state: 'SP' as const,
  postalCode: '01001-000',
  pixKey: '',
};

describe('business schema', () => {
  it('validates and normalizes professional data', () => {
    const parsed = businessSchema.parse(validBusiness);
    expect(normalizeBusinessInput(parsed)).toMatchObject({
      document_number: '52998224725',
      professional_phone: '11999999999',
      email: 'ana@example.com',
      postal_code: '01001000',
    });
  });
  it('rejects invalid document, state and postal code', () => {
    expect(
      businessSchema.safeParse({
        ...validBusiness,
        documentNumber: '111.111.111-11',
      }).success,
    ).toBe(false);
    expect(
      businessSchema.safeParse({ ...validBusiness, state: 'XX' }).success,
    ).toBe(false);
    expect(
      businessSchema.safeParse({ ...validBusiness, postalCode: '123' }).success,
    ).toBe(false);
  });
  it('presents validation messages with correct Portuguese accents', () => {
    const result = businessSchema.safeParse({
      ...validBusiness,
      businessName: '',
      professionalPhone: '',
    });

    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        'Informe o nome do negócio.',
        'Informe um telefone válido.',
      ]),
    );
  });
});
