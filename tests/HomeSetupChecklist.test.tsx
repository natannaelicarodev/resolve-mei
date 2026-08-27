import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import type { ReactElement } from 'react';
import { fireEvent, render as rtlRender } from '@testing-library/react-native';
import { router } from 'expo-router';

import { HomeDashboard } from '@/features/home/HomeDashboard';

function render(element: ReactElement) {
  return rtlRender(
    <BottomSheetModalProvider>{element}</BottomSheetModalProvider>,
  );
}

jest.mock('@/components/motion', () => {
  const { Pressable, View } = jest.requireActual('react-native');
  return {
    AnimatedPressable: Pressable,
    FadeInView: View,
    useReducedMotion: () => true,
  };
});

const complete = { profileConfigured: true, hasContact: true };

beforeEach(() => jest.clearAllMocks());

it('does not make a personal photo or business logo a setup requirement', async () => {
  const screen = await render(<HomeDashboard firstName="Ana" {...complete} />);
  expect(screen.queryByText('Prepare seu espaço')).toBeNull();
  expect(screen.queryByText(/logotipo/i)).toBeNull();
  expect(screen.queryByText(/foto/i)).toBeNull();
});

it('shows only current professional and contact requirements', async () => {
  const screen = await render(
    <HomeDashboard
      firstName="Ana"
      profileConfigured={false}
      hasContact={false}
      contactPendingField="phone"
    />,
  );
  expect(screen.getByTestId('setup-profile-pending')).toBeTruthy();
  expect(screen.getByTestId('setup-contact-pending')).toBeTruthy();
  expect(screen.queryByTestId('setup-logo-pending')).toBeNull();
  expect(screen.getAllByText('Completar')).toHaveLength(2);
});

it('keeps contextual navigation for the remaining requirements', async () => {
  const screen = await render(
    <HomeDashboard
      firstName="Ana"
      profileConfigured={false}
      hasContact={false}
      contactPendingField="phone"
    />,
  );
  fireEvent.press(screen.getByLabelText('Completar perfil profissional'));
  expect(router.push).toHaveBeenLastCalledWith({
    pathname: '/profile',
    params: { section: 'professional', field: 'first-required' },
  });
  fireEvent.press(screen.getByLabelText('Adicionar telefone'));
  expect(router.push).toHaveBeenLastCalledWith({
    pathname: '/profile',
    params: { section: 'personal', field: 'phone' },
  });
});
