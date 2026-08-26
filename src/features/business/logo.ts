import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export const MAX_LOGO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;
export type LogoMimeType = (typeof ALLOWED_LOGO_TYPES)[number];
export type LogoExtension = 'jpg' | 'png' | 'webp';
export type LogoOperationStage =
  'read' | 'convert' | 'upload' | 'database-update' | 'cleanup';

interface LogoDiagnosticMetadata {
  mimeType?: LogoMimeType;
  size?: number;
  extension?: LogoExtension;
}

export function normalizeLogoMimeType(
  type: string | null | undefined,
): LogoMimeType {
  const normalized = type?.trim().toLowerCase();
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') {
    return 'image/jpeg';
  }
  if (normalized === 'image/png') return 'image/png';
  if (normalized === 'image/webp') return 'image/webp';
  throw new Error('LOGO_INVALID_TYPE');
}

export function extensionForMimeType(type: LogoMimeType): LogoExtension {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

export function validateLogo(
  asset: Pick<ImagePickerAsset, 'fileSize' | 'mimeType'>,
): void {
  normalizeLogoMimeType(asset.mimeType);
  if (
    asset.fileSize !== undefined &&
    (!Number.isFinite(asset.fileSize) ||
      asset.fileSize <= 0 ||
      asset.fileSize > MAX_LOGO_BYTES)
  ) {
    throw new Error('LOGO_INVALID_SIZE');
  }
}

export async function readLogoArrayBuffer(
  asset: Pick<ImagePickerAsset, 'fileSize' | 'mimeType' | 'uri'>,
): Promise<ArrayBuffer> {
  const mimeType = normalizeLogoMimeType(asset.mimeType);
  const extension = extensionForMimeType(mimeType);
  validateLogo(asset);
  let file: File;

  try {
    file = new File(asset.uri);
    if (!file.exists) throw new Error('LOGO_READ_FAILED');
    if (asset.fileSize === undefined && file.size > MAX_LOGO_BYTES) {
      throw new Error('LOGO_INVALID_SIZE');
    }
  } catch (error) {
    logLogoDiagnostic('read', error, {
      mimeType,
      size: asset.fileSize,
      extension,
    });
    throw error;
  }

  try {
    const buffer = await file.arrayBuffer();
    if (
      Object.prototype.toString.call(buffer) !== '[object ArrayBuffer]' ||
      buffer.byteLength <= 0 ||
      buffer.byteLength > MAX_LOGO_BYTES
    ) {
      throw new Error('LOGO_INVALID_BUFFER');
    }
    return buffer;
  } catch (error) {
    logLogoDiagnostic('convert', error, {
      mimeType,
      size: asset.fileSize ?? file.size,
      extension,
    });
    throw error;
  }
}

export async function uploadBusinessLogo(
  userId: string,
  asset: ImagePickerAsset,
): Promise<string> {
  validateLogo(asset);
  const mimeType = normalizeLogoMimeType(asset.mimeType);
  const extension = extensionForMimeType(mimeType);
  const body = await readLogoArrayBuffer(asset);

  try {
    const path = `${userId}/${Crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from('business-logos')
      .upload(path, body, {
        cacheControl: '3600',
        contentType: mimeType,
        upsert: false,
      });
    if (error) throw error;
    return path;
  } catch (error) {
    logLogoDiagnostic('upload', error, {
      mimeType,
      size: body.byteLength,
      extension,
    });
    throw error;
  }
}

export async function createLogoSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('business-logos')
    .createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeBusinessLogo(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('business-logos')
    .remove([path]);
  if (error) throw error;
}

export function logLogoDiagnostic(
  stage: LogoOperationStage,
  error: unknown,
  metadata: LogoDiagnosticMetadata = {},
): void {
  if (!__DEV__) return;

  const diagnostic: Record<string, unknown> = {
    stage,
    category: stage === 'database-update' ? 'database' : 'storage',
    name: error instanceof Error ? error.name : 'UnknownError',
    ...metadata,
  };
  if (typeof error === 'object' && error !== null) {
    if (
      'code' in error &&
      typeof error.code === 'string' &&
      /^[a-z0-9_]{1,64}$/i.test(error.code)
    ) {
      diagnostic.code = error.code;
    }
    const status =
      'status' in error
        ? error.status
        : 'statusCode' in error
          ? error.statusCode
          : undefined;
    if (typeof status === 'number' && Number.isInteger(status)) {
      diagnostic.status = status;
    }
  }
  console.error('Business logo operation failed', diagnostic);
}
