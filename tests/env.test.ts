import { parsePublicEnv } from '@/config/env';

const valid = {
  EXPO_PUBLIC_APP_ENV: 'staging',
  EXPO_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example_123456789',
};

describe('public environment', () => {
  it('accepts valid public Supabase configuration', () => {
    expect(parsePublicEnv(valid)).toEqual(valid);
  });

  it('rejects invalid environments and insecure URLs', () => {
    expect(() =>
      parsePublicEnv({ ...valid, EXPO_PUBLIC_APP_ENV: 'secret' }),
    ).toThrow();
    expect(() =>
      parsePublicEnv({
        ...valid,
        EXPO_PUBLIC_SUPABASE_URL: 'http://project.local',
      }),
    ).toThrow();
  });

  it('rejects missing Supabase configuration', () => {
    expect(() =>
      parsePublicEnv({ EXPO_PUBLIC_APP_ENV: 'development' }),
    ).toThrow();
  });
});
