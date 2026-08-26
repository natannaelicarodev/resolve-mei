import { useLocalSearchParams } from 'expo-router';
import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ClientDetailsScreen } from '@/features/clients/ClientDetailsScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function ClientDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (business.isLoading)
    return <LoadingScreen label="Carregando cliente..." />;
  if (!business.data || !id)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <ClientDetailsScreen businessId={business.data.id} clientId={id} />;
}
