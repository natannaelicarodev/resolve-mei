import { useLocalSearchParams } from 'expo-router';
import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ClientFormScreen } from '@/features/clients/ClientFormScreen';
import { useClient } from '@/features/clients/hooks';
import { useAuth } from '@/providers/AuthProvider';

export default function EditClientRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const business = useMyBusiness(userId);
  const client = useClient(userId, business.data?.id ?? '', id ?? '');
  if (business.isLoading || client.isLoading)
    return <LoadingScreen label="Carregando cliente..." />;
  if (!business.data || !client.data)
    return <ErrorFallback onRetry={() => void client.refetch()} />;
  return (
    <ClientFormScreen businessId={business.data.id} client={client.data} />
  );
}
