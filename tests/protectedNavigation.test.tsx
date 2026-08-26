import { router } from 'expo-router';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import {
  navigateBackOrFallback,
  ProtectedPageHeader,
} from '@/features/navigation/ProtectedNavigation';
import { ThemeProvider } from '@/theme';

describe('protected back navigation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('goes back when the navigator has history', () => {
    jest.mocked(router.canGoBack).mockReturnValue(true);

    navigateBackOrFallback('/clients');

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces with a safe fallback when there is no history', () => {
    jest.mocked(router.canGoBack).mockReturnValue(false);

    navigateBackOrFallback('/clients');

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/clients');
  });

  it('uses the explicit destination even when history exists', () => {
    jest.mocked(router.canGoBack).mockReturnValue(true);

    navigateBackOrFallback('/home', true);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/home');
  });

  it('dismisses to an existing destination for a native back transition', () => {
    navigateBackOrFallback('/clients', true, true);

    expect(router.dismissTo).toHaveBeenCalledWith('/clients');
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('runs header navigation from an effect after the press update', async () => {
    jest.mocked(router.canGoBack).mockReturnValue(false);
    const screen = await render(
      <ThemeProvider>
        <ProtectedPageHeader
          alwaysUseBackFallback
          back
          backFallback="/home"
          title="Cliente"
        />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByLabelText('Voltar'));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/home'));
  });
});
