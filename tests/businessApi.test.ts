import {
  completeOnboarding,
  getMyBusiness,
  updateExistingBusiness,
} from '@/features/business/api';
import { supabase } from '@/lib/supabase';

const upsert = jest.fn();
const update = jest.fn();
const maybeSingle = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn() } }));

const input = {
  businessName: 'Ana Servicos',
  documentType: 'cpf' as const,
  documentNumber: '52998224725',
  professionalPhone: '11999999999',
  email: 'ana@example.com',
  street: 'Rua Um',
  number: '10',
  complement: '',
  neighborhood: 'Centro',
  city: 'Sao Paulo',
  state: 'SP' as const,
  postalCode: '01001000',
  pixKey: '',
};
const draft = { id: 'business-1', owner_id: 'user-1', logo_path: null };

function configureQueries(completionError: Error | null) {
  upsert.mockReturnValue({
    select: () => ({ single: async () => ({ data: draft, error: null }) }),
  });
  update.mockReturnValue({
    eq: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({
            data: { ...draft, onboarding_completed: true },
            error: completionError,
          }),
        }),
      }),
    }),
  });
  jest
    .mocked(supabase.from)
    .mockReturnValueOnce({ upsert } as never)
    .mockReturnValueOnce({ update } as never);
}

describe('completeOnboarding', () => {
  beforeEach(() => jest.clearAllMocks());
  it('marks onboarding complete only after the draft persists', async () => {
    configureQueries(null);
    await expect(completeOnboarding('user-1', input)).resolves.toMatchObject({
      onboarding_completed: true,
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        owner_id: 'user-1',
        onboarding_completed: false,
      }),
      { onConflict: 'owner_id' },
    );
    expect(update).toHaveBeenCalledWith({ onboarding_completed: true });
  });
  it('leaves the persisted draft incomplete when final persistence fails', async () => {
    configureQueries(new Error('failure'));
    await expect(completeOnboarding('user-1', input)).rejects.toThrow(
      'failure',
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_completed: false }),
      { onConflict: 'owner_id' },
    );
  });
});

describe('getMyBusiness', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses maybeSingle and normalizes an absent business to null', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    jest.mocked(supabase.from).mockReturnValue({
      select: () => ({ maybeSingle }),
    } as never);

    await expect(getMyBusiness()).resolves.toBeNull();
    expect(supabase.from).toHaveBeenCalledWith('businesses');
    expect(maybeSingle).toHaveBeenCalledTimes(1);
  });

  it('continues to reject a real Supabase error', async () => {
    const error = { code: '42501', message: 'permission denied' };
    maybeSingle.mockResolvedValue({ data: null, error });
    jest.mocked(supabase.from).mockReturnValue({
      select: () => ({ maybeSingle }),
    } as never);

    await expect(getMyBusiness()).rejects.toBe(error);
  });
});

describe('updateExistingBusiness', () => {
  beforeEach(() => jest.clearAllMocks());

  function configureUpdate(error: Error | null) {
    const single = jest.fn().mockResolvedValue({
      data: { ...draft, onboarding_completed: true },
      error,
    });
    const select = jest.fn(() => ({ single }));
    const ownerEq = jest.fn(() => ({ select }));
    const idEq = jest.fn(() => ({ eq: ownerEq }));
    const updateExisting = jest.fn((_values: unknown) => ({ eq: idEq }));
    jest.mocked(supabase.from).mockReturnValue({
      update: updateExisting,
    } as never);
    return { idEq, ownerEq, single, updateExisting };
  }

  it('updates only the existing owned business with normalized fields', async () => {
    const chain = configureUpdate(null);

    await updateExistingBusiness('user-1', 'business-1', {
      ...input,
      documentNumber: '529.982.247-25',
      postalCode: '01001-000',
    });

    expect(chain.updateExisting).toHaveBeenCalledWith({
      business_name: 'Ana Servicos',
      document_type: 'cpf',
      document_number: '52998224725',
      professional_phone: '11999999999',
      email: 'ana@example.com',
      street: 'Rua Um',
      number: '10',
      complement: null,
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      postal_code: '01001000',
      pix_key: null,
      onboarding_completed: true,
    });
    expect(chain.idEq).toHaveBeenCalledWith('id', 'business-1');
    expect(chain.ownerEq).toHaveBeenCalledWith('owner_id', 'user-1');
    expect(chain.single).toHaveBeenCalledTimes(1);
    expect(chain.updateExisting.mock.calls[0]?.[0]).not.toHaveProperty(
      'owner_id',
    );
    expect(chain.updateExisting.mock.calls[0]?.[0]).not.toHaveProperty(
      'logo_path',
    );
  });
});
