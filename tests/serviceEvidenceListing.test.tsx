import { render } from '@testing-library/react-native';

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
 * Um caso por arquivo: depois de um press seguido de unmount, um render
 * posterior no mesmo arquivo volta vazio sob este harness.
 */
it('lists uploaded evidence with its category and protection state', async () => {
  mockEvidence([
    {
      id: 'evidence-1',
      category: 'before',
      note: 'Quadro antes do reparo',
      signedUrl: 'https://example.test/1.jpg',
      locked_at: null,
    },
    {
      id: 'evidence-2',
      category: 'after',
      note: null,
      signedUrl: 'https://example.test/2.jpg',
      locked_at: '2026-09-01T12:00:00Z',
    },
  ]);

  const screen = await renderSection();

  expect(screen.getByText('2/20')).toBeTruthy();
  expect(screen.getByText('Antes')).toBeTruthy();
  expect(screen.getByText('Depois')).toBeTruthy();
  expect(screen.getByText('Quadro antes do reparo')).toBeTruthy();
  // Uma evidência protegida não oferece exclusão.
  expect(screen.getAllByRole('button', { name: 'Excluir' })).toHaveLength(1);

  await screen.unmount();
});
