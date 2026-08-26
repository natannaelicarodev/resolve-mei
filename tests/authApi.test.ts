import {
  handleAuthCallbackUrl,
  requestPasswordReset,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from '@/features/auth/api';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
      exchangeCodeForSession: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'resolvemei://auth-callback'),
  parse: jest.fn((url: string) => ({
    queryParams: url.includes('code=') ? { code: url.split('code=')[1] } : {},
  })),
}));

const auth = supabase.auth;

describe('authentication API', () => {
  beforeEach(() => jest.clearAllMocks());

  it('registers with normalized email and profile metadata', async () => {
    jest
      .mocked(auth.signUp)
      .mockResolvedValue({ data: { session: null, user: null }, error: null });
    await expect(
      signUp({
        fullName: ' Ana Silva ',
        email: ' ANA@EXAMPLE.COM ',
        password: 'Strong123',
      }),
    ).resolves.toBeNull();
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'Strong123',
      options: {
        data: { full_name: 'Ana Silva' },
        emailRedirectTo: 'resolvemei://auth-callback',
      },
    });
  });

  it('logs in without exposing account details', async () => {
    jest.mocked(auth.signInWithPassword).mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    } as never);
    await signIn(' USER@EXAMPLE.COM ', 'password');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password',
    });
  });

  it('requests recovery using an application redirect', async () => {
    jest
      .mocked(auth.resetPasswordForEmail)
      .mockResolvedValue({ data: {}, error: null });
    await requestPasswordReset('user@example.com');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({ redirectTo: expect.any(String) }),
    );
  });

  it('updates the password and signs out', async () => {
    jest
      .mocked(auth.updateUser)
      .mockResolvedValue({ data: { user: null }, error: null } as never);
    jest.mocked(auth.signOut).mockResolvedValue({ error: null });
    await updatePassword('NewStrong123');
    await signOut();
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'NewStrong123' });
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('exchanges a recovery callback code without exposing it', async () => {
    jest.mocked(auth.exchangeCodeForSession).mockResolvedValue({
      data: { session: null, user: null },
      error: null,
    } as never);
    await expect(
      handleAuthCallbackUrl('resolvemei://auth-callback?code=test-code'),
    ).resolves.toBe('recovery');
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('test-code');
  });
});
