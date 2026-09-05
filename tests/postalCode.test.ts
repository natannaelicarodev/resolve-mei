import {
  formatPostalCode,
  lookupPostalCode,
  postalCodeQueryKey,
} from '@/features/business/postalCode';

describe('postal-code lookup', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('formats and keys only the eight CEP digits', () => {
    expect(formatPostalCode('01001000')).toBe('01001-000');
    expect(postalCodeQueryKey('01001-000')).toEqual([
      'public',
      'postal-code',
      '01001000',
    ]);
  });

  it('maps a ViaCEP response to the editable address fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    });

    await expect(lookupPostalCode('01001-000')).resolves.toEqual({
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://viacep.com.br/ws/01001000/json/',
      { signal: undefined },
    );
  });

  it('rejects malformed and unknown CEPs without inventing an address', async () => {
    await expect(lookupPostalCode('123')).rejects.toThrow(
      'INVALID_POSTAL_CODE',
    );

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ erro: true }),
    });
    await expect(lookupPostalCode('99999999')).rejects.toThrow(
      'POSTAL_CODE_NOT_FOUND',
    );
  });

  it('surfaces network failure so the form can remain in manual mode', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed'));
    await expect(lookupPostalCode('01001000')).rejects.toThrow(
      'Network request failed',
    );
  });
});
