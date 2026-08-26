import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

export async function signUp(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<Session | null> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: { full_name: input.fullName.trim() },
      emailRedirectTo: getAuthCallbackRedirectUrl(),
    },
  });
  if (error) throw error;
  return data.session;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
}

export function getAuthCallbackRedirectUrl(): string {
  return Linking.createURL('auth-callback');
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    {
      redirectTo: getAuthCallbackRedirectUrl(),
    },
  );
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function handleAuthCallbackUrl(
  url: string,
): Promise<'recovery' | 'session'> {
  const parsed = Linking.parse(url);
  const code = asSingleString(parsed.queryParams?.code);
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return 'recovery';
  }

  const fragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const fragmentParams = new URLSearchParams(fragment);
  const accessToken = fragmentParams.get('access_token');
  const refreshToken = fragmentParams.get('refresh_token');
  const type = fragmentParams.get('type');
  if (!accessToken || !refreshToken) {
    throw new Error('Invalid authentication callback');
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) throw error;
  return type === 'recovery' ? 'recovery' : 'session';
}

function asSingleString(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
