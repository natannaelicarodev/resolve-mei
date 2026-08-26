import React from 'react';
import { render } from '@testing-library/react-native';

import ProtectedLayout from '@app/(protected)/_layout';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { useMyBusiness } from '@/features/business/hooks';
import { useAuth } from '@/providers/AuthProvider';
import { usePathname } from 'expo-router';

jest.mock('@/features/business/hooks', () => ({
  useMyBusiness: jest.fn(),
}));
jest.mock('@/providers/AuthProvider', () => ({ useAuth: jest.fn() }));

const consoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => undefined);

describe('ProtectedLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({
      isLoading: false,
      user: { id: 'user-1' },
    } as ReturnType<typeof useAuth>);
    jest.mocked(useMyBusiness).mockReturnValue({
      data: null,
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyBusiness>);
  });

  afterAll(() => consoleError.mockRestore());

  it('redirects an authenticated user without a business to onboarding without triggering the boundary', async () => {
    jest.mocked(usePathname).mockReturnValue('/home');

    const screen = await render(
      <AppErrorBoundary>
        <ProtectedLayout />
      </AppErrorBoundary>,
    );

    expect(screen.toJSON()).toMatchObject({
      type: 'Redirect',
      props: { href: '/onboarding' },
    });
    expect(screen.queryByText('Algo deu errado')).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('redirects a user with completed onboarding to the authenticated home', async () => {
    jest.mocked(usePathname).mockReturnValue('/onboarding');
    jest.mocked(useMyBusiness).mockReturnValue({
      data: { onboarding_completed: true },
      error: null,
      isError: false,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyBusiness>);

    const screen = await render(<ProtectedLayout />);

    expect(screen.toJSON()).toMatchObject({
      type: 'Redirect',
      props: { href: '/home' },
    });
  });
});
