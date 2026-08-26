import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { normalizeBusinessInput } from './schemas';
import type { BusinessFormData } from './schemas';

export type Business = Database['public']['Tables']['businesses']['Row'];

export async function getMyBusiness(): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function completeOnboarding(
  userId: string,
  input: BusinessFormData,
): Promise<Business> {
  const normalized = normalizeBusinessInput(input);
  const { data: draft, error: draftError } = await supabase
    .from('businesses')
    .upsert(
      { owner_id: userId, ...normalized, onboarding_completed: false },
      { onConflict: 'owner_id' },
    )
    .select('*')
    .single();
  if (draftError) throw draftError;

  const { data: completed, error: completionError } = await supabase
    .from('businesses')
    .update({ onboarding_completed: true })
    .eq('id', draft.id)
    .eq('owner_id', userId)
    .select('*')
    .single();
  if (completionError) throw completionError;
  return completed;
}

export async function updateExistingBusiness(
  userId: string,
  businessId: string,
  input: BusinessFormData,
): Promise<Business> {
  const normalized = normalizeBusinessInput(input);

  const { data, error } = await supabase
    .from('businesses')
    .update({
      ...normalized,
      onboarding_completed: true,
    })
    .eq('id', businessId)
    .eq('owner_id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }
  return data;
}
