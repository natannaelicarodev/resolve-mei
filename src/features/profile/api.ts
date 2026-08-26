import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { digitsOnly } from '@/utils/documents';
import type { ImagePickerAsset } from 'expo-image-picker';
import { removeAvatar, uploadAvatar } from './avatar';
import type { ProfileFormData } from './schemas';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export const profileQueryKey = (userId: string) =>
  ['private', userId, 'profile'] as const;

export async function getMyProfile(
  userId: string,
  signal?: AbortSignal,
): Promise<Profile> {
  let query = supabase.from('profiles').select('*').eq('id', userId);
  if (signal) query = query.abortSignal(signal);
  const { data, error } = await query.single();
  if (error) throw error;
  if (data.id !== userId) throw new Error('PROFILE_IDENTITY_MISMATCH');
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
  const values: Database['public']['Tables']['profiles']['Insert'] = {
    id: userId,
    full_name: input.fullName.trim(),
    phone: input.phone ? digitsOnly(input.phone) : null,
    ...(uploadedAvatarPath ? { avatar_path: uploadedAvatarPath } : {}),
  };
  const { data, error } = await supabase
    .from('profiles')
    .upsert(values, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) {
    if (uploadedAvatarPath)
      await removeAvatar(uploadedAvatarPath).catch(() => undefined);
    throw error;
  }
  if (data.id !== userId) {
    if (uploadedAvatarPath)
      await removeAvatar(uploadedAvatarPath).catch(() => undefined);
    throw new Error('PROFILE_IDENTITY_MISMATCH');
  }
  if (uploadedAvatarPath && currentAvatarPath)
    await removeAvatar(currentAvatarPath).catch(() => undefined);
  return data;
}
