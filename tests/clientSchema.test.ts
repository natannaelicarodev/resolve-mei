import { clientSchema, normalizeClientInput } from '@/features/clients/schemas';

describe('client schema', () => {
  it('normalizes optional contact data without mixing ownership fields', () => {
    const input = clientSchema.parse({
      type: 'person',
      name: '  Maria Silva  ',
      document: '529.982.247-25',
      phone: '(11) 99999-1234',
      email: 'MARIA@EXAMPLE.COM',
      notes: '  Preferência por WhatsApp  ',
      status: 'active',
    });
    expect(normalizeClientInput(input)).toEqual({
      type: 'person',
      name: 'Maria Silva',
      document: '52998224725',
      phone: '11999991234',
      email: 'maria@example.com',
      notes: 'Preferência por WhatsApp',
      status: 'active',
    });
    expect(normalizeClientInput(input)).not.toHaveProperty('business_id');
  });

  it('accepts a company and rejects invalid documents and phone numbers', () => {
    expect(
      clientSchema.safeParse({
        type: 'company',
        name: 'Empresa Exemplo',
        document: '04.252.011/0001-10',
        phone: '',
        email: '',
        notes: '',
        status: 'active',
      }).success,
    ).toBe(true);
    expect(
      clientSchema.safeParse({
        type: 'person',
        name: 'Maria',
        document: '111.111.111-11',
        phone: '123',
        email: '',
        notes: '',
        status: 'active',
      }).success,
    ).toBe(false);
  });

  it('normalizes empty optional fields to null', () => {
    const input = clientSchema.parse({
      type: 'person',
      name: 'Maria',
      document: '',
      phone: '',
      email: '',
      notes: '',
      status: 'inactive',
    });
    expect(normalizeClientInput(input)).toMatchObject({
      document: null,
      phone: null,
      email: null,
      notes: null,
      status: 'inactive',
    });
  });
});
