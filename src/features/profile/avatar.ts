import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import type { ImagePickerAsset } from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
export type AvatarMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export function getProfileInitial(name?: string) {
  return (
    name
      ?.trim()
      .match(/[A-Za-zÀ-ÖØ-öø-ÿ]/)?.[0]
      .toUpperCase() ?? 'U'
  );
}

export function normalizeAvatarMimeType(value?: string | null): AvatarMimeType {
  const type = value?.trim().toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg') return 'image/jpeg';
  if (type === 'image/png') return 'image/png';
  if (type === 'image/webp') return 'image/webp';
  throw new Error('AVATAR_INVALID_TYPE');
}

export function avatarExtension(type: AvatarMimeType) {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

export function validateAvatar(
  asset: Pick<ImagePickerAsset, 'fileSize' | 'mimeType'>,
) {
  normalizeAvatarMimeType(asset.mimeType);
  if (
    asset.fileSize !== undefined &&
    (!Number.isFinite(asset.fileSize) ||
      asset.fileSize <= 0 ||
      asset.fileSize > MAX_AVATAR_BYTES)
  )
    throw new Error('AVATAR_INVALID_SIZE');
}

export async function readAvatarArrayBuffer(
  asset: ImagePickerAsset,
): Promise<ArrayBuffer> {
  validateAvatar(asset);
  const file = new File(asset.uri);
  if (!file.exists) throw new Error('AVATAR_READ_FAILED');
  if (asset.fileSize === undefined && file.size > MAX_AVATAR_BYTES)
    throw new Error('AVATAR_INVALID_SIZE');
  const buffer = await file.arrayBuffer();
  if (
    Object.prototype.toString.call(buffer) !== '[object ArrayBuffer]' ||
    buffer.byteLength <= 0 ||
    buffer.byteLength > MAX_AVATAR_BYTES
  )
    throw new Error('AVATAR_INVALID_BUFFER');
  return buffer;
}

export async function uploadAvatar(
  userId: string,
  asset: ImagePickerAsset,
): Promise<string> {
  const mimeType = normalizeAvatarMimeType(asset.mimeType);
  const extension = avatarExtension(mimeType);
  const body = await readAvatarArrayBuffer(asset);
  const path = `${userId}/${Crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('avatars').upload(path, body, {
    cacheControl: '3600',
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function createAvatarSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeAvatar(path: string): Promise<void> {
  const { error } = await supabase.storage.from('avatars').remove([path]);
  if (error) throw error;
}
