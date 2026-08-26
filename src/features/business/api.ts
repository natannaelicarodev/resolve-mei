import type { ImagePickerAsset } from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import {
  logLogoDiagnostic,
  removeBusinessLogo,
  uploadBusinessLogo,
} from './logo';
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
  logo?: ImagePickerAsset,
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

  const logoPath = logo
    ? await uploadBusinessLogo(userId, logo)
    : draft.logo_path;
  const { data: completed, error: completionError } = await supabase
    .from('businesses')
    .update({ logo_path: logoPath, onboarding_completed: true })
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
  currentLogoPath: string | null,
  logo?: ImagePickerAsset,
): Promise<Business> {
  const normalized = normalizeBusinessInput(input);
  const uploadedLogoPath = logo
    ? await uploadBusinessLogo(userId, logo)
    : undefined;

  const { data, error } = await supabase
    .from('businesses')
    .update({
      ...normalized,
      onboarding_completed: true,
      ...(uploadedLogoPath ? { logo_path: uploadedLogoPath } : {}),
    })
    .eq('id', businessId)
    .eq('owner_id', userId)
    .select('*')
    .single();

  if (error) {
    logLogoDiagnostic('database-update', error);
    if (uploadedLogoPath) {
      await removeBusinessLogo(uploadedLogoPath).catch((cleanupError) => {
        logLogoDiagnostic('cleanup', cleanupError);
      });
    }
    throw error;
  }

  if (uploadedLogoPath && currentLogoPath) {
    await removeBusinessLogo(currentLogoPath).catch((cleanupError) => {
      logLogoDiagnostic('cleanup', cleanupError);
    });
  }
  return data;
}
