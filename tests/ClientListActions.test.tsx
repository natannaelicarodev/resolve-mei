import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { ClientListScreen } from '@/features/clients/ClientListScreen';
import { useClients } from '@/features/clients/hooks';
import { ThemeProvider } from '@/theme';
import { useAuth } from '@/providers/AuthProvider';

jest.mock('@/features/clients/hooks', () => ({ useClients: jest.fn() }));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useClients).mockReturnValue({
    data: [],
    isError: false,
    isLoading: false,
    isSuccess: true,
  } as unknown as ReturnType<typeof useClients>);
  jest.mocked(useAuth).mockReturnValue({
    user: { id: 'user-1' },
  } as ReturnType<typeof useAuth>);
});

it('shows an explicit add-client action and opens the creation form', async () => {
  const screen = await render(
    <ThemeProvider>
      <ClientListScreen businessId="business-1" />
    </ThemeProvider>,
  );

  const action = screen.getByRole('button', { name: 'Novo cliente' });
  expect(action.props.accessibilityHint).toBe(
    'Abre o formulário para adicionar um cliente.',
  );
  fireEvent.press(action);
  expect(router.push).toHaveBeenCalledWith('/clients/new');
  expect(screen.getByText('Todos')).toBeTruthy();
  expect(screen.queryByText(/✓/)).toBeNull();

  await screen.unmount();
});
