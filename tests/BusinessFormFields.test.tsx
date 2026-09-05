import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { useForm } from 'react-hook-form';

import { BusinessFormFields } from '@/features/business/BusinessFormFields';
import type { BusinessFormData } from '@/features/business/schemas';

function FieldsHarness() {
  const { control, setValue } = useForm<BusinessFormData>({
    defaultValues: {
      businessName: 'Ana Serviços',
      documentType: 'cpf',
      documentNumber: '529.982.247-25',
      professionalPhone: '11999999999',
      email: 'ana@example.com',
      street: 'Rua Um',
      number: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      postalCode: '01001000',
      pixKey: '',
    },
  });
  return <BusinessFormFields control={control} setValue={setValue} />;
}

it('keeps professional fields and exposes no business logo upload', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <FieldsHarness />
    </QueryClientProvider>,
  );
  expect(screen.getByLabelText('Nome do negócio')).toBeTruthy();
  expect(screen.getByLabelText('Chave Pix')).toBeTruthy();
  expect(screen.queryByText(/logotipo/i)).toBeNull();
  expect(screen.queryByText(/JPEG, PNG ou WebP/i)).toBeNull();
  await screen.unmount();
  queryClient.clear();
});
