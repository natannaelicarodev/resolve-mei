import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { updateExistingBusiness } from '@/features/business/api';
import type { Business } from '@/features/business/api';
import { businessQueryKey, useMyBusiness } from '@/features/business/hooks';
import {
  ProfessionalProfileForm,
  businessToFormData,
  emptyProfessionalFormValues,
  resolveFirstRequiredBusinessField,
} from '@/features/profile/ProfessionalProfileForm';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/business/api', () => ({
  updateExistingBusiness: jest.fn(),
}));
jest.mock('@/features/business/hooks', () => ({
  businessQueryKey: (userId: string) => ['private', userId, 'business'],
  useMyBusiness: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/profile/navigation', () => ({
  scheduleProfileRedirect: jest.fn(() => jest.fn()),
}));

const business: Business = {
  id: 'business-1',
  owner_id: 'user-1',
  business_name: 'Ana Serviços',
  document_type: 'cpf',
  document_number: '52998224725',
  professional_phone: '11988887777',
  email: 'ana@empresa.com',
  street: 'Rua Um',
  number: '10',
  complement: 'Sala 2',
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  postal_code: '01001000',
  pix_key: 'ana@pix.com',
  logo_path: 'user-1/logo.webp',
  onboarding_completed: true,
  created_at: '2026-08-25T00:00:00Z',
  updated_at: '2026-08-25T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

it('maps all existing professional fields into the reusable form', () => {
  expect(businessToFormData(business)).toEqual({
    businessName: 'Ana Serviços',
    documentType: 'cpf',
    documentNumber: '529.982.247-25',
    professionalPhone: '11988887777',
    email: 'ana@empresa.com',
    street: 'Rua Um',
    number: '10',
    complement: 'Sala 2',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01001000',
    pixKey: 'ana@pix.com',
  });
});

it('defines every professional field in the empty reset object', () => {
  expect(Object.keys(emptyProfessionalFormValues).sort()).toEqual(
    Object.keys(businessToFormData(business)).sort(),
  );
  expect(emptyProfessionalFormValues).toEqual({
    businessName: '',
    documentType: 'cpf',
    documentNumber: '',
    professionalPhone: '',
    email: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    postalCode: '',
    pixKey: '',
  });
});

it('resolves the first missing required professional field in form order', () => {
  expect(
    resolveFirstRequiredBusinessField({ ...business, business_name: '' }),
  ).toBe('businessName');
  expect(
    resolveFirstRequiredBusinessField({
      ...business,
      professional_phone: '',
      email: '',
    }),
  ).toBe('professionalPhone');
  expect(
    resolveFirstRequiredBusinessField({ ...business, postal_code: '' }),
  ).toBe('postalCode');
});

it('updates professional data without rendering the profile image control', async () => {
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(useMyBusiness).mockReturnValue({
    data: business,
    isError: false,
    isLoading: false,
  } as ReturnType<typeof useMyBusiness>);
  jest
    .mocked(updateExistingBusiness)
    .mockResolvedValue({ ...business, business_name: 'Ana MEI' });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: 0, retry: false },
      mutations: { gcTime: 0, retry: false },
    },
  });
  const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');
  const setQueryData = jest.spyOn(queryClient, 'setQueryData');
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ProfessionalProfileForm />
    </QueryClientProvider>,
  );

  expect(screen.queryByLabelText('Logotipo atual do negócio')).toBeNull();
  expect(screen.getByDisplayValue('Ana Serviços')).toBeTruthy();
  expect(screen.getByDisplayValue('529.982.247-25')).toBeTruthy();
  await fireEvent.changeText(
    screen.getByLabelText('Nome do negócio'),
    'Ana MEI',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Salvar dados profissionais' }),
  );

  expect(
    await screen.findByText('Dados profissionais atualizados com sucesso.'),
  ).toBeTruthy();
  expect(updateExistingBusiness).toHaveBeenCalledWith(
    'user-1',
    'business-1',
    expect.objectContaining({
      businessName: 'Ana MEI',
      documentNumber: '529.982.247-25',
      professionalPhone: '11988887777',
      postalCode: '01001000',
    }),
  );
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: businessQueryKey('user-1'),
  });
  expect(setQueryData).toHaveBeenCalledWith(
    businessQueryKey('user-1'),
    expect.objectContaining({ business_name: 'Ana MEI' }),
  );
  expect(router.replace).not.toHaveBeenCalled();

  await screen.unmount();
  queryClient.clear();
});

it('clears and fully rehydrates professional data across A to B to A', async () => {
  const businessA = { ...business };
  const businessB: Business = {
    ...business,
    id: 'business-2',
    owner_id: 'user-2',
    business_name: 'B Oficina',
    professional_phone: '21977776666',
    email: 'b@empresa.com',
    street: 'Rua Dois',
    number: '20',
    complement: null,
    neighborhood: 'Bairro B',
    city: 'Rio de Janeiro',
    state: 'RJ',
    postal_code: '20040002',
    pix_key: null,
  };
  let currentUserId = 'user-1';
  let currentBusiness: Business | undefined = businessA;
  jest
    .mocked(useAuth)
    .mockImplementation(
      () => ({ user: { id: currentUserId } }) as ReturnType<typeof useAuth>,
    );
  jest.mocked(useMyBusiness).mockImplementation(
    () =>
      ({
        data: currentBusiness,
        isError: false,
        isLoading: !currentBusiness,
      }) as ReturnType<typeof useMyBusiness>,
  );
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: 0, retry: false },
      mutations: { gcTime: 0, retry: false },
    },
  });
  const view = await render(
    <QueryClientProvider client={queryClient}>
      <ProfessionalProfileForm />
    </QueryClientProvider>,
  );

  expect(await view.findByDisplayValue('Ana Serviços')).toBeTruthy();
  expect(view.getByDisplayValue('Sala 2')).toBeTruthy();

  currentUserId = 'user-2';
  currentBusiness = undefined;
  await view.rerender(
    <QueryClientProvider client={queryClient}>
      <ProfessionalProfileForm />
    </QueryClientProvider>,
  );
  expect(view.queryByDisplayValue('Ana Serviços')).toBeNull();
  expect(view.queryByDisplayValue('Sala 2')).toBeNull();

  currentBusiness = businessB;
  await view.rerender(
    <QueryClientProvider client={queryClient}>
      <ProfessionalProfileForm />
    </QueryClientProvider>,
  );
  expect(await view.findByDisplayValue('B Oficina')).toBeTruthy();
  expect(view.getByDisplayValue('b@empresa.com')).toBeTruthy();
  expect(view.queryByDisplayValue('Sala 2')).toBeNull();
  expect(view.queryByDisplayValue('ana@pix.com')).toBeNull();

  currentUserId = 'user-1';
  currentBusiness = undefined;
  await view.rerender(
    <QueryClientProvider client={queryClient}>
      <ProfessionalProfileForm />
    </QueryClientProvider>,
  );
  expect(view.queryByDisplayValue('B Oficina')).toBeNull();
  expect(view.queryByDisplayValue('b@empresa.com')).toBeNull();

  currentBusiness = businessA;
  await view.rerender(
    <QueryClientProvider client={queryClient}>
      <ProfessionalProfileForm />
    </QueryClientProvider>,
  );
  expect(await view.findByDisplayValue('Ana Serviços')).toBeTruthy();
  expect(view.getByDisplayValue('ana@empresa.com')).toBeTruthy();
  expect(view.getByDisplayValue('Sala 2')).toBeTruthy();

  await view.unmount();
  queryClient.clear();
});

it('ignores a professional mutation result after the authenticated identity changes', async () => {
  const businessB: Business = {
    ...business,
    id: 'business-2',
    owner_id: 'user-2',
    business_name: 'B Oficina',
  };
  let currentUserId = 'user-1';
  let currentBusiness = business;
  let resolveUpdate: (value: Business) => void = () => undefined;
  jest.mocked(updateExistingBusiness).mockReturnValue(
    new Promise((resolve) => {
      resolveUpdate = resolve;
    }),
  );
  jest
    .mocked(useAuth)
    .mockImplementation(
      () => ({ user: { id: currentUserId } }) as ReturnType<typeof useAuth>,
    );
  jest.mocked(useMyBusiness).mockImplementation(
    () =>
      ({
        data: currentBusiness,
        isError: false,
        isLoading: false,
      }) as ReturnType<typeof useMyBusiness>,
  );
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: 0, retry: false },
      mutations: { gcTime: 0, retry: false },
    },
  });
  const view = await render(
    <QueryClientProvider client={queryClient}>
      <ProfessionalProfileForm />
    </QueryClientProvider>,
  );
  expect(await view.findByDisplayValue('Ana Serviços')).toBeTruthy();

  await fireEvent.press(
    view.getByRole('button', { name: 'Salvar dados profissionais' }),
  );
  await waitFor(() =>
    expect(updateExistingBusiness).toHaveBeenCalledWith(
      'user-1',
      'business-1',
      expect.any(Object),
    ),
  );

  currentUserId = 'user-2';
  currentBusiness = businessB;
  await view.rerender(
    <QueryClientProvider client={queryClient}>
      <ProfessionalProfileForm />
    </QueryClientProvider>,
  );
  expect(await view.findByDisplayValue('B Oficina')).toBeTruthy();

  await act(async () => {
    resolveUpdate({ ...business, business_name: 'A atualizada' });
  });
  await waitFor(() => expect(queryClient.isMutating()).toBe(0));

  expect(
    view.queryByText('Dados profissionais atualizados com sucesso.'),
  ).toBeNull();
  expect(queryClient.getQueryData(businessQueryKey('user-2'))).toBeUndefined();

  await view.unmount();
  queryClient.clear();
});
