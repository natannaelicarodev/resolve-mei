import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

export const RAW_IMAGE_LIMIT = 10 * 1024 * 1024;
export const COMPRESSED_IMAGE_LIMIT = 3 * 1024 * 1024;

export async function localFileSize(uri: string) {
  const file = new File(uri);
  if (!file.exists) throw new Error('IMAGE_READ_FAILED');
  return file.size;
}

export async function compressImageForUpload(asset: ImagePickerAsset) {
  const rawSize = asset.fileSize ?? (await localFileSize(asset.uri));
  if (rawSize <= 0 || rawSize > RAW_IMAGE_LIMIT)
    throw new Error('RAW_TOO_LARGE');
  let width = Math.min(asset.width || 2000, 2000);
  let quality = 0.82;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const result = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG },
    );
    if ((await localFileSize(result.uri)) <= COMPRESSED_IMAGE_LIMIT)
      return result.uri;
    width = Math.round(width * 0.78);
    quality = Math.max(0.48, quality - 0.12);
  }
  throw new Error('COMPRESSED_TOO_LARGE');
}
