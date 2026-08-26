import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { digitsOnly } from '@/utils/documents';
import type { ImagePickerAsset } from 'expo-image-picker';
import { removeAvatar, uploadAvatar } from './avatar';
import type { ProfileFormData } from './schemas';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export const profileQueryKey = ['profile', 'mine'] as const;

export async function getMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(
  userId: string,
  input: ProfileFormData,
  currentAvatarPath?: string | null,
  avatar?: ImagePickerAsset,
): Promise<Profile> {
  const uploadedAvatarPath = avatar
    ? await uploadAvatar(userId, avatar)
    : undefined;
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone ? digitsOnly(input.phone) : null,
      ...(uploadedAvatarPath ? { avatar_path: uploadedAvatarPath } : {}),
    })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) {
    if (uploadedAvatarPath)
      await removeAvatar(uploadedAvatarPath).catch(() => undefined);
    throw error;
  }
  if (uploadedAvatarPath && currentAvatarPath)
    await removeAvatar(currentAvatarPath).catch(() => undefined);
  return data;
}
