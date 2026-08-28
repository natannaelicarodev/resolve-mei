import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function IndexRoute() {
  const { isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen label="Verificando sessão..." />;
  return <Redirect href={user ? '/home' : '/welcome'} />;
}
