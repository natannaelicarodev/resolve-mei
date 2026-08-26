import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { updateExistingBusiness } from '@/features/business/api';
import type { Business } from '@/features/business/api';
import { businessQueryKey, useMyBusiness } from '@/features/business/hooks';
import { createLogoSignedUrl } from '@/features/business/logo';
import {
  ProfessionalProfileForm,
  businessToFormData,
} from '@/features/profile/ProfessionalProfileForm';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/business/api', () => ({
  updateExistingBusiness: jest.fn(),
}));
jest.mock('@/features/business/hooks', () => ({
  businessQueryKey: ['business', 'mine'],
  useMyBusiness: jest.fn(),
}));
jest.mock('@/features/business/logo', () => ({
  createLogoSignedUrl: jest.fn(),
  validateLogo: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/profile/navigation', () => ({
  scheduleProfileRedirect: jest.fn(() => jest.fn()),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(() => ({ data: 'https://signed.example/logo' })),
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

it('updates only professional data, shows the signed logo, and refreshes its cache', async () => {
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
  jest.mocked(useMyBusiness).mockReturnValue({
    data: business,
    isError: false,
    isLoading: false,
  } as ReturnType<typeof useMyBusiness>);
  jest
    .mocked(createLogoSignedUrl)
    .mockResolvedValue('https://signed.example/logo');
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

  expect(
    await screen.findByLabelText('Logotipo atual do negócio'),
  ).toBeTruthy();
  expect(screen.getByDisplayValue('Ana Serviços')).toBeTruthy();
  expect(screen.getByDisplayValue('529.982.247-25')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Nome do negócio'), 'Ana MEI');
  fireEvent.press(
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
    'user-1/logo.webp',
    undefined,
  );
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: businessQueryKey,
  });
  expect(setQueryData).toHaveBeenCalledWith(
    businessQueryKey,
    expect.objectContaining({ business_name: 'Ana MEI' }),
  );
  expect(router.replace).not.toHaveBeenCalled();

  await screen.unmount();
  queryClient.clear();
});
