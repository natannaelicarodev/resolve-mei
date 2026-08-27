import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import {
  financialPrivacyStorageKey,
  useFinancialPrivacy,
} from '@/features/home/useFinancialPrivacy';

function Probe({ userId }: { userId: string }) {
  const privacy = useFinancialPrivacy(userId);
  return (
    <>
      <Text>{`${privacy.hydrated}:${privacy.hidden}`}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void privacy.toggle()}
      >
        <Text>Alternar</Text>
      </Pressable>
    </>
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('starts hidden, hydrates per user and persists only the boolean', async () => {
  let resolveStorage: (value: string | null) => void = () => undefined;
  jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveStorage = resolve;
      }),
  );
  const screen = await render(<Probe userId="user-a" />);
  expect(screen.getByText('false:true')).toBeTruthy();
  await act(async () => resolveStorage('false'));
  await waitFor(() => expect(screen.getByText('true:false')).toBeTruthy());
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Alternar' }));
  });
  expect(await AsyncStorage.getItem(financialPrivacyStorageKey('user-a'))).toBe(
    'true',
  );
  expect(
    (await AsyncStorage.getAllKeys()).every((key) => !key.includes('245000')),
  ).toBe(true);
});

it('returns to the safe hidden state when the account changes', async () => {
  await AsyncStorage.setItem(financialPrivacyStorageKey('user-a'), 'false');
  const screen = await render(<Probe userId="user-a" />);
  await waitFor(() => expect(screen.getByText('true:false')).toBeTruthy());
  let resolveStorage: (value: string | null) => void = () => undefined;
  jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveStorage = resolve;
      }),
  );
  await screen.rerender(<Probe userId="user-b" />);
  expect(screen.getByText('false:true')).toBeTruthy();
  await act(async () => resolveStorage(null));
  await waitFor(() => expect(screen.getByText('true:true')).toBeTruthy());
});
