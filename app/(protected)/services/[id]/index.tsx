import { useLocalSearchParams } from 'expo-router';

import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ServiceDetailsScreen } from '@/features/services/ServiceDetailsScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function ServiceDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (business.isLoading)
    return <LoadingScreen label="Carregando serviço..." />;
  if (!business.data || !id)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <ServiceDetailsScreen businessId={business.data.id} serviceId={id} />;
}
