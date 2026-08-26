import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { digitsOnly } from '@/utils/documents';
import type { ProfileFormData } from './schemas';

export type Profile = Database['public']['Tables']['profiles']['Row'];

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
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.fullName.trim(),
      phone: input.phone ? digitsOnly(input.phone) : null,
    })
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
