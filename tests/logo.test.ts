import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import {
  MAX_LOGO_BYTES,
  extensionForMimeType,
  normalizeLogoMimeType,
  readLogoArrayBuffer,
  uploadBusinessLogo,
  validateLogo,
} from '@/features/business/logo';
import { supabase } from '@/lib/supabase';

const mockArrayBuffer = jest.fn();
const mockFile = { exists: true, size: 3, arrayBuffer: mockArrayBuffer };
const upload = jest.fn();

jest.mock('expo-file-system', () => ({
  File: jest.fn(() => mockFile),
}));
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn() }));
jest.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: jest.fn() } },
}));

const asset = {
  uri: 'file:///private/sensitive/logo.png',
  width: 100,
  height: 100,
  mimeType: 'image/png',
  fileSize: 3,
};

describe('business logo binary conversion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFile.exists = true;
    mockFile.size = 3;
    mockArrayBuffer.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);
    jest.mocked(Crypto.randomUUID).mockReturnValue('fixed-uuid');
    upload.mockResolvedValue({ data: {}, error: null });
    jest.mocked(supabase.storage.from).mockReturnValue({ upload } as never);
  });

  it('reads the selected Expo file as a real ArrayBuffer', async () => {
    const result = await readLogoArrayBuffer(asset);

    expect(File).toHaveBeenCalledWith(asset.uri);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(new Uint8Array(result))).toEqual([1, 2, 3]);
  });

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/jpg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ] as const)('normalizes %s to its canonical extension', (mime, extension) => {
    const normalized = normalizeLogoMimeType(mime);
    expect(extensionForMimeType(normalized)).toBe(extension);
  });

  it.each([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ] as const)(
    'uploads %s as an ArrayBuffer with a normalized .%s path',
    async (mimeType, extension) => {
      const path = await uploadBusinessLogo('user-sensitive-id', {
        ...asset,
        mimeType,
      });

      expect(path).toBe(`user-sensitive-id/fixed-uuid.${extension}`);
      const [uploadedPath, payload, options] = upload.mock.calls[0] as [
        string,
        ArrayBuffer,
        Record<string, unknown>,
      ];
      expect(uploadedPath).toBe(path);
      expect(payload).toBeInstanceOf(ArrayBuffer);
      expect(options).toEqual({
        cacheControl: '3600',
        contentType: mimeType,
        upsert: false,
      });
    },
  );

  it('rejects a file larger than 5 MB before reading it', async () => {
    await expect(
      readLogoArrayBuffer({ ...asset, fileSize: MAX_LOGO_BYTES + 1 }),
    ).rejects.toThrow('LOGO_INVALID_SIZE');
    expect(File).not.toHaveBeenCalled();
    expect(mockArrayBuffer).not.toHaveBeenCalled();
  });

  it('rejects an unsupported MIME type', () => {
    expect(() =>
      validateLogo({ mimeType: 'image/svg+xml', fileSize: 1000 }),
    ).toThrow('LOGO_INVALID_TYPE');
  });

  it('reports a sanitized read-stage failure', async () => {
    jest.mocked(File).mockImplementationOnce(() => {
      throw Object.assign(new Error('private URI detail'), {
        code: 'FILE_UNREADABLE',
      });
    });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(readLogoArrayBuffer(asset)).rejects.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      'Business logo operation failed',
      expect.objectContaining({
        stage: 'read',
        category: 'storage',
        code: 'FILE_UNREADABLE',
        mimeType: 'image/png',
        size: 3,
        extension: 'png',
      }),
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(asset.uri);
    consoleError.mockRestore();
  });

  it('rejects and diagnoses a conversion failure', async () => {
    mockArrayBuffer.mockRejectedValue(new Error('conversion detail'));
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(readLogoArrayBuffer(asset)).rejects.toThrow(
      'conversion detail',
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Business logo operation failed',
      expect.objectContaining({ stage: 'convert' }),
    );
    consoleError.mockRestore();
  });

  it('propagates and safely diagnoses an upload failure', async () => {
    upload.mockResolvedValue({
      data: null,
      error: {
        name: 'StorageApiError',
        message: 'token and path details',
        code: 'UPLOAD_FAILED',
        statusCode: 500,
      },
    });
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(
      uploadBusinessLogo('user-sensitive-id', asset),
    ).rejects.toMatchObject({ code: 'UPLOAD_FAILED' });
    const serialized = JSON.stringify(consoleError.mock.calls);
    expect(serialized).toContain('upload');
    expect(serialized).not.toContain(asset.uri);
    expect(serialized).not.toContain('user-sensitive-id');
    expect(serialized).not.toContain('token and path details');
    consoleError.mockRestore();
  });
});
