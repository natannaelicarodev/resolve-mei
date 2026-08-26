import { render } from '@testing-library/react-native';

import HomeRoute from '@app/(protected)/home';
import { useMyBusiness } from '@/features/business/hooks';

jest.mock('@/features/business/hooks', () => ({
  useMyBusiness: jest.fn(),
}));
jest.mock('expo-router', () => ({
  Link: jest.requireActual('react-native').Text,
}));

it('presents the main authenticated texts with correct Portuguese accents', async () => {
  jest.mocked(useMyBusiness).mockReturnValue({
    data: { business_name: 'Ana Serviços' },
  } as ReturnType<typeof useMyBusiness>);

  const screen = await render(<HomeRoute />);

  expect(screen.getByText('Ana Serviços')).toBeTruthy();
  expect(
    screen.getByText(
      'Sua área autenticada está pronta. As ferramentas comerciais serão adicionadas nas próximas fases.',
    ),
  ).toBeTruthy();
  expect(screen.getByText('Configurações')).toBeTruthy();
});
