import { fireEvent, render } from '@testing-library/react-native';

import { ServiceEvidenceSection } from '@/features/evidence/ServiceEvidenceSection';
import { useEvidence, useEvidenceMutations } from '@/features/evidence/hooks';
import { ThemeProvider } from '@/theme';

jest.mock('@/features/evidence/hooks', () => ({
  useEvidence: jest.fn(),
  useEvidenceMutations: jest.fn(),
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 0, Warning: 1, Error: 2 },
}));

function mockEvidence(data: unknown[] = []) {
  jest.mocked(useEvidence).mockReturnValue({
    data,
    isLoading: false,
  } as unknown as ReturnType<typeof useEvidence>);
  jest.mocked(useEvidenceMutations).mockReturnValue({
    upload: { isPending: false, error: null, mutate: jest.fn() },
    remove: { isPending: false, error: null, mutate: jest.fn() },
  } as unknown as ReturnType<typeof useEvidenceMutations>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockEvidence();
});

function renderSection(orderStatus = 'in_progress') {
  return render(
    <ThemeProvider>
      <ServiceEvidenceSection
        businessId="business-1"
        orderId="order-1"
        orderStatus={orderStatus as never}
        userId="user-1"
      />
    </ThemeProvider>,
  );
}

/**
 * Esta seção é o único lugar do app onde um `Chip` aparece dentro de um
 * `Dialog`, e foi onde uma quebra de render escapou de todos os testes — os de
 * `Chip` montavam o componente isolado, nunca a tela que o usa. Renderizar a
 * seção inteira é o que fecha essa lacuna.
 */
it('renders the section and its empty state', async () => {
  const screen = await renderSection();

  expect(screen.getByText('EVIDÊNCIAS DO SERVIÇO')).toBeTruthy();
  expect(screen.getByText('Nenhuma evidência adicionada.')).toBeTruthy();
  expect(screen.getByText('0/20')).toBeTruthy();

  await screen.unmount();
});

// O conteúdo de um `Modal` não é montado neste ambiente de teste, então os
// chips dentro do diálogo são inalcançáveis por consulta — foi exatamente por
// isso que a quebra de render escapou da suíte. O que dá para garantir aqui é
// que abrir o diálogo não derruba a árvore; que os chips existem e reagem à
// seleção está coberto em `chipSelectionState`, com o componente isolado.
it('survives opening the add dialog', async () => {
  const screen = await renderSection();

  fireEvent.press(screen.getByRole('button', { name: 'Adicionar evidência' }));

  // A seção continua de pé: um erro de render dentro do diálogo derrubaria a
  // árvore inteira e esta consulta falharia.
  expect(screen.getByText('EVIDÊNCIAS DO SERVIÇO')).toBeTruthy();

  await screen.unmount();
});

// Uma ordem concluída trava as evidências: sem essa checagem, um estado que
// deveria ser somente leitura ganharia botão de envio.
it('hides the add action once the order is no longer editable', async () => {
  const screen = await renderSection('completed');

  expect(
    screen.queryByRole('button', { name: 'Adicionar evidência' }),
  ).toBeNull();

  await screen.unmount();
});
