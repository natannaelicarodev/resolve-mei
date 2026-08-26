import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';

import { signOut as performSignOut } from '@/features/auth/api';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  beginPasswordRecovery: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const currentUserId = useRef<string | null>(null);
  const transitionGeneration = useRef(0);

  const applySession = useCallback(
    async (nextSession: Session | null) => {
      const nextUserId = nextSession?.user.id ?? null;
      if (currentUserId.current === nextUserId) {
        setSession(nextSession);
        setIsLoading(false);
        return;
      }

      const generation = ++transitionGeneration.current;
      currentUserId.current = null;
      setSession(null);
      setIsLoading(Boolean(nextUserId));
      await queryClient.cancelQueries();
      queryClient.clear();
      if (transitionGeneration.current !== generation) return;
      currentUserId.current = nextUserId;
      setSession(nextSession);
      setIsLoading(false);
    },
    [queryClient],
  );

  const signOut = useCallback(async () => {
    ++transitionGeneration.current;
    currentUserId.current = null;
    setSession(null);
    setIsLoading(false);
    await queryClient.cancelQueries();
    queryClient.clear();
    await performSignOut();
  }, [queryClient]);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && !authEventReceived) void applySession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        authEventReceived = true;
        void applySession(nextSession);
        setIsPasswordRecovery(event === 'PASSWORD_RECOVERY');
        setIsLoading(false);
      },
    );

    const appStateListener =
      Platform.OS === 'web'
        ? null
        : AppState.addEventListener('change', (state) => {
            if (state === 'active') supabase.auth.startAutoRefresh();
            else supabase.auth.stopAutoRefresh();
          });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      appStateListener?.remove();
      if (Platform.OS !== 'web') supabase.auth.stopAutoRefresh();
    };
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      isPasswordRecovery,
      clearPasswordRecovery: () => setIsPasswordRecovery(false),
      beginPasswordRecovery: () => setIsPasswordRecovery(true),
      signOut,
    }),
    [isLoading, isPasswordRecovery, session, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
