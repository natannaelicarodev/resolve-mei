import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

import { env } from '@/config/env';
import type { Database } from '@/types/database';
import { secureAuthStorage } from './authStorage';

export function createSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(
    env.EXPO_PUBLIC_SUPABASE_URL,
    env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        ...(Platform.OS === 'web' ? {} : { storage: secureAuthStorage }),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  );
}

export const supabase = createSupabaseClient();
