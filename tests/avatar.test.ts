import { File } from 'expo-file-system';

import {
  createAvatarSignedUrl,
  normalizeAvatarMimeType,
  readAvatarArrayBuffer,
  uploadAvatar,
  validateAvatar,
} from '@/features/profile/avatar';
import { supabase } from '@/lib/supabase';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'avatar-id' }));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));
jest.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: jest.fn() } },
}));

const asset = {
  uri: 'file:///private/avatar.jpg',
  width: 100,
  height: 100,
  mimeType: 'image/jpeg',
  fileSize: 1024,
};

beforeEach(() => jest.clearAllMocks());

it.each([
  ['image/jpeg', 'image/jpeg'],
  ['image/jpg', 'image/jpeg'],
  ['image/png', 'image/png'],
  ['image/webp', 'image/webp'],
])('normalizes %s', (value, expected) =>
  expect(normalizeAvatarMimeType(value)).toBe(expected),
);

it('rejects invalid MIME and files above 5 MB before reading', () => {
  expect(() =>
    validateAvatar({ mimeType: 'image/svg+xml', fileSize: 10 }),
  ).toThrow('AVATAR_INVALID_TYPE');
  expect(() =>
    validateAvatar({ mimeType: 'image/png', fileSize: 5 * 1024 * 1024 + 1 }),
  ).toThrow('AVATAR_INVALID_SIZE');
  expect(File).not.toHaveBeenCalled();
});

it('reads and uploads a real ArrayBuffer to the owned private path', async () => {
  const payload = new ArrayBuffer(8);
  jest.mocked(File).mockImplementation(
    () =>
      ({
        exists: true,
        size: 8,
        arrayBuffer: jest.fn().mockResolvedValue(payload),
      }) as never,
  );
  const upload = jest.fn().mockResolvedValue({ error: null });
  jest.mocked(supabase.storage.from).mockReturnValue({ upload } as never);
  await expect(readAvatarArrayBuffer(asset)).resolves.toBe(payload);
  await expect(uploadAvatar('user-1', asset)).resolves.toBe(
    'user-1/avatar-id.jpg',
  );
  expect(upload).toHaveBeenCalledWith('user-1/avatar-id.jpg', payload, {
    cacheControl: '3600',
    contentType: 'image/jpeg',
    upsert: false,
  });
  expect(upload.mock.calls[0]?.[1]).toBeInstanceOf(ArrayBuffer);
});

it('fails safely when the local file cannot be read', async () => {
  jest
    .mocked(File)
    .mockImplementation(() => ({ exists: false, size: 0 }) as never);
  await expect(readAvatarArrayBuffer(asset)).rejects.toThrow(
    'AVATAR_READ_FAILED',
  );
});

it('creates only a temporary signed URL from the avatar bucket', async () => {
  const createSignedUrl = jest.fn().mockResolvedValue({
    data: { signedUrl: 'https://signed.example/avatar' },
    error: null,
  });
  jest
    .mocked(supabase.storage.from)
    .mockReturnValue({ createSignedUrl } as never);
  await expect(createAvatarSignedUrl('user-1/avatar-id.jpg')).resolves.toBe(
    'https://signed.example/avatar',
  );
  expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
  expect(createSignedUrl).toHaveBeenCalledWith('user-1/avatar-id.jpg', 300);
});
