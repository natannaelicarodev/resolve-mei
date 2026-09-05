import { render } from '@testing-library/react-native';

import { ExpenseListScreen } from '@/features/expenses/ExpenseListScreen';
import {
  useExpenseMonth,
  useExpenseMutations,
} from '@/features/expenses/hooks';
import { ThemeProvider } from '@/theme';

jest.mock('@/features/expenses/hooks', () => ({
  useExpenseMonth: jest.fn(),
  useExpenseMutations: jest.fn(),
}));
jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    AnimatedPressable: Pressable,
    FadeInView: View,
    useReducedMotion: () => true,
  };
});

function mockMonth(data: unknown) {
  jest.mocked(useExpenseMonth).mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useExpenseMonth>);
  jest.mocked(useExpenseMutations).mockReturnValue({
    remove: {
      isError: false,
      isPending: false,
      error: null,
      mutate: jest.fn(),
    },
  } as unknown as ReturnType<typeof useExpenseMutations>);
}

beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Somar o mês exigia rolar a lista inteira ou sair para a tela de Resultado.
 * O total ao lado do seletor é o que torna a navegação entre meses útil.
 */
it('shows the month total beside the month selector', async () => {
  mockMonth({
    month: '2026-09',
    expenseCents: '145080',
    byCategory: [{ category: 'material', amountCents: '145080' }],
    expenses: [
      {
        id: 'expense-1',
        category: 'material',
        description: 'Cabo flexível',
        occurredOn: '2026-09-01',
        amountCents: '145080',
        recurring: false,
        receiptCount: 0,
        quoteNumber: null,
        clientName: null,
      },
    ],
  });

  const screen = await render(
    <ThemeProvider>
      <ExpenseListScreen businessId="business-1" userId="user-1" />
    </ThemeProvider>,
  );

  // Cabeçalho, detalhamento com comprovante e a própria despesa.
  expect(screen.getAllByText('R$ 1.450,80')).toHaveLength(3);
  expect(screen.getByText('lançamento registrado')).toBeTruthy();
  expect(screen.getByText('comprovantes anexados')).toBeTruthy();
  expect(
    screen.getByLabelText(
      'Distribuição das despesas por comprovante. Com comprovante: R$ 0,00. Sem comprovante: R$ 1.450,80.',
    ),
  ).toBeTruthy();

  await screen.unmount();
});

it('shows a zero total while the month is still loading', async () => {
  jest.mocked(useExpenseMonth).mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: jest.fn(),
  } as unknown as ReturnType<typeof useExpenseMonth>);
  jest.mocked(useExpenseMutations).mockReturnValue({
    remove: {
      isError: false,
      isPending: false,
      error: null,
      mutate: jest.fn(),
    },
  } as unknown as ReturnType<typeof useExpenseMutations>);

  const screen = await render(
    <ThemeProvider>
      <ExpenseListScreen businessId="business-1" userId="user-1" />
    </ThemeProvider>,
  );

  // O cabeçalho não pode ficar vazio enquanto carrega: o seletor de mês
  // continua utilizável e o total assume zero até chegar.
  expect(screen.getByText('R$ 0,00')).toBeTruthy();

  await screen.unmount();
});
