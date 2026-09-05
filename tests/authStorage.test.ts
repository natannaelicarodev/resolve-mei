import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { secureAuthStorage, splitSecureValue } from '@/lib/authStorage';

jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>();
  return {
    deleteItemAsync: jest.fn(async (key: string) => {
      values.delete(key);
    }),
    getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    __clear: () => values.clear(),
  };
});

const authKey = 'sb-test-auth-token';

describe('secureAuthStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (
      SecureStore as typeof SecureStore & { __clear: () => void }
    ).__clear();
    await AsyncStorage.clear();
  });

  it('stores and reads a value only from SecureStore', async () => {
    await secureAuthStorage.setItem(authKey, 'session');

    expect(await secureAuthStorage.getItem(authKey)).toBe('session');
    expect(await AsyncStorage.getItem(authKey)).toBeNull();
  });

  it('segments large values without splitting Unicode code points', async () => {
    const value = `${'a'.repeat(2200)}${'🚀'.repeat(500)}${'b'.repeat(2200)}`;

    expect(splitSecureValue(value).length).toBeGreaterThan(1);
    await secureAuthStorage.setItem(authKey, value);

    expect(await secureAuthStorage.getItem(authKey)).toBe(value);
  });

  it('overwrites a large value with a smaller value', async () => {
    await secureAuthStorage.setItem(authKey, 'x'.repeat(5000));
    await secureAuthStorage.setItem(authKey, 'short');

    expect(await secureAuthStorage.getItem(authKey)).toBe('short');
  });

  it('removes secure and legacy values on logout', async () => {
    await secureAuthStorage.setItem(authKey, 'session');
    await AsyncStorage.setItem(authKey, 'legacy');

    await secureAuthStorage.removeItem(authKey);

    expect(await secureAuthStorage.getItem(authKey)).toBeNull();
    expect(await AsyncStorage.getItem(authKey)).toBeNull();
  });

  it('migrates and then removes a verified legacy session', async () => {
    await AsyncStorage.setItem(authKey, 'legacy-session');

    expect(await secureAuthStorage.getItem(authKey)).toBe('legacy-session');
    expect(await AsyncStorage.getItem(authKey)).toBeNull();
    expect(await secureAuthStorage.getItem(authKey)).toBe('legacy-session');
  });

  it('keeps the legacy session when secure migration fails', async () => {
    await AsyncStorage.setItem(authKey, 'legacy-session');
    jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('disk'));

    await expect(secureAuthStorage.getItem(authKey)).rejects.toThrow('disk');
    expect(await AsyncStorage.getItem(authKey)).toBe('legacy-session');
  });
});
