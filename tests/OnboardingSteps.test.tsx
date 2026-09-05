import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render } from '@testing-library/react-native';

import { completeOnboarding } from '@/features/business/api';
import { OnboardingScreen } from '@/features/business/OnboardingScreen';
import { triggerHaptic } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/business/api', () => ({
  completeOnboarding: jest.fn(),
}));
jest.mock('@/features/business/hooks', () => ({
  businessQueryKey: (userId: string) => ['private', userId, 'business'],
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/haptics', () => ({
  triggerHaptic: jest.fn(() => Promise.resolve()),
}));
jest.mock('@/features/business/postalCode', () => ({
  ...jest.requireActual('@/features/business/postalCode'),
  lookupPostalCode: jest.fn().mockResolvedValue({
    street: 'Rua das Flores',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
  }),
}));

async function renderOnboarding() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: 0, retry: false },
      mutations: { gcTime: 0, retry: false },
    },
  });
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <OnboardingScreen />
    </QueryClientProvider>,
  );
  const dispose = async () => {
    await screen.unmount();
    queryClient.clear();
  };
  return { dispose, screen };
}

async function fillBusinessStep(
  screen: Awaited<ReturnType<typeof render>>,
): Promise<void> {
  await fireEvent.press(
    screen.getByRole('radio', {
      name: 'Criar orçamentos com mais agilidade',
    }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
  await fireEvent.changeText(
    screen.getByLabelText('Nome do negócio'),
    'Ana Serviços',
  );
  await fireEvent.changeText(
    screen.getByLabelText('Número do CPF'),
    '52998224725',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1', email: 'ana@example.com' },
  } as ReturnType<typeof useAuth>);
});

it('starts on the first step and shows textual progress', async () => {
  const { dispose, screen } = await renderOnboarding();

  expect(screen.getByText('Etapa 1 de 6')).toBeTruthy();
  expect(screen.getByText('O que você quer organizar primeiro?')).toBeTruthy();
  expect(screen.getByLabelText('17% concluído')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();

  await dispose();
});

it('blocks an invalid step and does not advance', async () => {
  const { dispose, screen } = await renderOnboarding();

  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

  expect(await screen.findByText('Etapa 1 de 6')).toBeTruthy();
  expect(
    screen.getByText('Escolha uma prioridade para continuar.'),
  ).toBeTruthy();
  expect(screen.queryByText('Etapa 2 de 6')).toBeNull();
  expect(completeOnboarding).not.toHaveBeenCalled();

  await dispose();
});

it('advances, goes back, and keeps the data entered in each step', async () => {
  const { dispose, screen } = await renderOnboarding();

  await fillBusinessStep(screen);
  expect(await screen.findByText('Etapa 3 de 6')).toBeTruthy();
  expect(screen.getByDisplayValue('ana@example.com')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

  expect(await screen.findByText('Etapa 2 de 6')).toBeTruthy();
  expect(screen.getByDisplayValue('Ana Serviços')).toBeTruthy();
  expect(screen.getByDisplayValue('529.982.247-25')).toBeTruthy();

  await dispose();
});

it('switches the document type accessibly and clears the previous number', async () => {
  const { dispose, screen } = await renderOnboarding();

  await fireEvent.press(
    screen.getByRole('radio', { name: 'Criar orçamentos com mais agilidade' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

  await fireEvent.changeText(
    screen.getByLabelText('Número do CPF'),
    '52998224725',
  );
  expect(screen.getByDisplayValue('529.982.247-25')).toBeTruthy();

  const cnpj = screen.getByRole('radio', { name: 'CNPJ' });
  expect(cnpj.props.accessibilityState.selected).toBe(false);
  await fireEvent.press(cnpj);

  expect(await screen.findByLabelText('Número do CNPJ')).toBeTruthy();
  expect(screen.queryByDisplayValue('529.982.247-25')).toBeNull();
  expect(triggerHaptic).toHaveBeenCalledWith('selection');
  expect(
    screen.getByRole('radio', { name: 'CNPJ' }).props.accessibilityState
      .selected,
  ).toBe(true);

  await dispose();
});

it('does not save partially: the mutation only runs on the last step', async () => {
  jest.mocked(completeOnboarding).mockResolvedValue(undefined as never);
  const { dispose, screen } = await renderOnboarding();

  await fillBusinessStep(screen);
  expect(await screen.findByText('Etapa 3 de 6')).toBeTruthy();
  await fireEvent.changeText(
    screen.getByLabelText('Telefone profissional'),
    '11988887777',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

  expect(await screen.findByText('Etapa 4 de 6')).toBeTruthy();
  expect(completeOnboarding).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Concluir perfil' })).toBeNull();

  await dispose();
});

it('shows every saved field in the final review and links each section back to editing', async () => {
  const { dispose, screen } = await renderOnboarding();

  await fillBusinessStep(screen);
  await fireEvent.changeText(
    screen.getByLabelText('Telefone profissional'),
    '11988887777',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

  await fireEvent.changeText(screen.getByLabelText('Rua'), 'Rua das Flores');
  await fireEvent.changeText(screen.getByLabelText(/mero$/), '123');
  await fireEvent.changeText(
    screen.getByLabelText('Complemento (opcional)'),
    'Sala 4',
  );
  await fireEvent.changeText(screen.getByLabelText('Bairro'), 'Centro');
  await fireEvent.changeText(screen.getByLabelText('Cidade'), 'SÃ£o Paulo');
  await fireEvent.changeText(screen.getByLabelText('CEP'), '01001000');
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

  await fireEvent.changeText(screen.getByLabelText('Chave Pix'), 'ana@pix');
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

  expect(await screen.findByText('Etapa 6 de 6')).toBeTruthy();
  expect(screen.getByText('529.982.247-25')).toBeTruthy();
  expect(screen.getByText('11988887777')).toBeTruthy();
  expect(screen.getByText('Rua das Flores')).toBeTruthy();
  expect(screen.getByText('Sala 4')).toBeTruthy();
  expect(screen.getByText('01001-000')).toBeTruthy();
  expect(screen.getByText('ana@pix')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Editar Neg/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Editar Contato' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Editar Endere/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Editar Pagamento' })).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: /Editar Endere/ }));
  expect(await screen.findByText('Etapa 4 de 6')).toBeTruthy();
  expect(screen.getByDisplayValue('Rua das Flores')).toBeTruthy();

  await dispose();
});
