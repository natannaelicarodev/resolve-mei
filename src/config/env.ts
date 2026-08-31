import { z } from 'zod';

const publicEnvSchema = z.object({
  EXPO_PUBLIC_APP_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  EXPO_PUBLIC_SUPABASE_URL: z
    .url()
    .refine(
      (value) => value.startsWith('https://'),
      'A URL publica do Supabase deve usar HTTPS.',
    ),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .min(20, 'A chave publica do Supabase e obrigatoria.'),
  EXPO_PUBLIC_CLIENT_QUOTE_BASE_URL: z
    .url()
    .refine(
      (value) => value.startsWith('https://'),
      'A página pública deve usar HTTPS.',
    )
    .optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function parsePublicEnv(
  source: Record<string, string | undefined>,
): PublicEnv {
  return publicEnvSchema.parse(source);
}

export const env = parsePublicEnv({
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  EXPO_PUBLIC_CLIENT_QUOTE_BASE_URL:
    process.env.EXPO_PUBLIC_CLIENT_QUOTE_BASE_URL,
});
