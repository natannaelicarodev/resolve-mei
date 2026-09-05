import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const CHUNK_MAX_UTF8_BYTES = 1800;
const MANIFEST_VERSION = 1;
const SECURE_KEY_PREFIX = 'tavi.auth';

interface SecureManifest {
  version: typeof MANIFEST_VERSION;
  generation: string;
  chunkCount: number;
}

function utf8CodePointSize(codePoint: number) {
  if (codePoint <= 0x7f) return 1;
  if (codePoint <= 0x7ff) return 2;
  if (codePoint <= 0xffff) return 3;
  return 4;
}

export function splitSecureValue(value: string) {
  if (!value) return [''];
  const chunks: string[] = [];
  let chunk = '';
  let chunkSize = 0;

  for (const character of value) {
    const characterSize = utf8CodePointSize(character.codePointAt(0) ?? 0);
    if (chunk && chunkSize + characterSize > CHUNK_MAX_UTF8_BYTES) {
      chunks.push(chunk);
      chunk = '';
      chunkSize = 0;
    }
    chunk += character;
    chunkSize += characterSize;
  }

  chunks.push(chunk);
  return chunks;
}

function encodeStorageKey(key: string) {
  return Array.from(key)
    .map((character) =>
      character
        .codePointAt(0)
        ?.toString(16)
        .padStart(6, '0'),
    )
    .join('');
}

function baseKey(key: string) {
  return `${SECURE_KEY_PREFIX}.${encodeStorageKey(key)}`;
}

function manifestKey(key: string) {
  return `${baseKey(key)}.manifest`;
}

function chunkKey(key: string, generation: string, index: number) {
  return `${baseKey(key)}.${generation}.${index}`;
}

function parseManifest(value: string | null): SecureManifest | null {
  if (!value) return null;
  const parsed: unknown = JSON.parse(value);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    parsed.version !== MANIFEST_VERSION ||
    !('generation' in parsed) ||
    typeof parsed.generation !== 'string' ||
    !('chunkCount' in parsed) ||
    !Number.isSafeInteger(parsed.chunkCount) ||
    Number(parsed.chunkCount) < 1
  ) {
    throw new Error('INVALID_SECURE_AUTH_MANIFEST');
  }
  return parsed as SecureManifest;
}

async function deleteChunks(key: string, manifest: SecureManifest | null) {
  if (!manifest) return;
  await Promise.all(
    Array.from({ length: manifest.chunkCount }, (_, index) =>
      SecureStore.deleteItemAsync(
        chunkKey(key, manifest.generation, index),
      ),
    ),
  );
}

async function readSecureValue(
  key: string,
  manifestValue?: string | null,
): Promise<string | null> {
  const serializedManifest =
    manifestValue === undefined
      ? await SecureStore.getItemAsync(manifestKey(key))
      : manifestValue;
  const manifest = parseManifest(serializedManifest);
  if (!manifest) return null;

  const chunks = await Promise.all(
    Array.from({ length: manifest.chunkCount }, (_, index) =>
      SecureStore.getItemAsync(chunkKey(key, manifest.generation, index)),
    ),
  );
  if (chunks.some((chunk) => chunk === null))
    throw new Error('INCOMPLETE_SECURE_AUTH_VALUE');
  return chunks.join('');
}

async function writeSecureValue(key: string, value: string) {
  const currentManifestValue = await SecureStore.getItemAsync(manifestKey(key));
  const currentManifest = parseManifest(currentManifestValue);
  const generation = `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2)}`;
  const chunks = splitSecureValue(value);
  const nextManifest: SecureManifest = {
    version: MANIFEST_VERSION,
    generation,
    chunkCount: chunks.length,
  };
  const nextManifestValue = JSON.stringify(nextManifest);

  try {
    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(chunkKey(key, generation, index), chunk),
      ),
    );
    const verifiedChunks = await Promise.all(
      chunks.map((_, index) =>
        SecureStore.getItemAsync(chunkKey(key, generation, index)),
      ),
    );
    if (verifiedChunks.some((chunk, index) => chunk !== chunks[index]))
      throw new Error('SECURE_AUTH_CHUNK_VERIFICATION_FAILED');

    await SecureStore.setItemAsync(manifestKey(key), nextManifestValue);
    if ((await SecureStore.getItemAsync(manifestKey(key))) !== nextManifestValue)
      throw new Error('SECURE_AUTH_MANIFEST_VERIFICATION_FAILED');
  } catch (error) {
    await deleteChunks(key, nextManifest);
    if (currentManifestValue === null)
      await SecureStore.deleteItemAsync(manifestKey(key));
    else
      await SecureStore.setItemAsync(manifestKey(key), currentManifestValue);
    throw error;
  }

  await deleteChunks(key, currentManifest);
}

export const secureAuthStorage = {
  async getItem(key: string) {
    const secureValue = await readSecureValue(key);
    if (secureValue !== null) return secureValue;

    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue === null) return null;

    await writeSecureValue(key, legacyValue);
    const migratedValue = await readSecureValue(key);
    if (migratedValue !== legacyValue)
      throw new Error('SECURE_AUTH_MIGRATION_VERIFICATION_FAILED');
    await AsyncStorage.removeItem(key);
    return migratedValue;
  },

  async setItem(key: string, value: string) {
    await writeSecureValue(key, value);
    await AsyncStorage.removeItem(key);
  },

  async removeItem(key: string) {
    const serializedManifest = await SecureStore.getItemAsync(manifestKey(key));
    const manifest = parseManifest(serializedManifest);
    await SecureStore.deleteItemAsync(manifestKey(key));
    await deleteChunks(key, manifest);
    await AsyncStorage.removeItem(key);
  },
};
