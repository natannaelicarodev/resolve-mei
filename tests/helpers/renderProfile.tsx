import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react-native';

import { ProfileScreen } from '@/features/profile/ProfileScreen';

export async function renderProfile({
  waitForPersonal = true,
}: { waitForPersonal?: boolean } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { gcTime: 0, retry: false },
      mutations: { gcTime: 0, retry: false },
    },
  });
  const invalidateQueries = jest.spyOn(queryClient, 'invalidateQueries');
  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <ProfileScreen />
    </QueryClientProvider>,
  );
  if (waitForPersonal)
    await waitFor(() =>
      expect(screen.getByDisplayValue('Ana Silva')).toBeTruthy(),
    );
  const dispose = async () => {
    await screen.unmount();
    queryClient.clear();
  };
  return { dispose, invalidateQueries, queryClient, screen };
}
