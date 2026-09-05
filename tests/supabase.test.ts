import { createClient } from '@supabase/supabase-js';

import { createSupabaseClient } from '@/lib/supabase';
import { secureAuthStorage } from '@/lib/authStorage';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ auth: {} })),
}));

describe('Supabase client', () => {
  it('uses only validated public configuration and safe auth options', () => {
    createSupabaseClient();
    expect(jest.mocked(createClient)).toHaveBeenLastCalledWith(
      'https://test-project.supabase.co',
      'sb_publishable_test_value_only_123456',
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          storage: secureAuthStorage,
        }),
      }),
    );
  });
});
