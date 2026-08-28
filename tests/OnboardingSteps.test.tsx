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

  expect(screen.getByText('Conte sobre seu negócio')).toBeTruthy();
  expect(screen.getByLabelText('20% concluído')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull();

  await dispose();
});

it('blocks an invalid step and does not advance', async () => {
  const { dispose, screen } = await renderOnboarding();

  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

  expect(await screen.findByText('Conte sobre seu negócio')).toBeTruthy();
  expect(screen.queryByText('Contato')).toBeNull();
  expect(completeOnboarding).not.toHaveBeenCalled();

  await dispose();
});

it('advances, goes back, and keeps the data entered in each step', async () => {
  const { dispose, screen } = await renderOnboarding();

  await fillBusinessStep(screen);
  expect(await screen.findByText('Contato')).toBeTruthy();
  expect(screen.getByDisplayValue('ana@example.com')).toBeTruthy();

  await fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));

  expect(await screen.findByText('Conte sobre seu negócio')).toBeTruthy();
  expect(screen.getByDisplayValue('Ana Serviços')).toBeTruthy();
  expect(screen.getByDisplayValue('529.982.247-25')).toBeTruthy();

  await dispose();
});

it('switches the document type accessibly and clears the previous number', async () => {
  const { dispose, screen } = await renderOnboarding();

  await fireEvent.changeText(
    screen.getByLabelText('Número do CPF'),
    '52998224725',
  );
  expect(screen.getByDisplayValue('529.982.247-25')).toBeTruthy();

  const cnpj = screen.getByRole('radio', { name: 'Pessoa jurídica' });
  expect(cnpj.props.accessibilityState.selected).toBe(false);
  await fireEvent.press(cnpj);

  expect(await screen.findByLabelText('Número do CNPJ')).toBeTruthy();
  expect(screen.queryByDisplayValue('529.982.247-25')).toBeNull();
  expect(triggerHaptic).toHaveBeenCalledWith('selection');
  expect(
    screen.getByRole('radio', { name: 'Pessoa jurídica' }).props
      .accessibilityState.selected,
  ).toBe(true);

  await dispose();
});

it('does not save partially: the mutation only runs on the last step', async () => {
  jest.mocked(completeOnboarding).mockResolvedValue(undefined as never);
  const { dispose, screen } = await renderOnboarding();

  await fillBusinessStep(screen);
  expect(await screen.findByText('Contato')).toBeTruthy();
  await fireEvent.changeText(
    screen.getByLabelText('Telefone profissional'),
    '11988887777',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Continuar' }));

  expect((await screen.findAllByText('Endereço')).length).toBeGreaterThan(0);
  expect(completeOnboarding).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Concluir perfil' })).toBeNull();

  await dispose();
});
