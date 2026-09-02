import { useLocalSearchParams } from 'expo-router';
import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ServiceOrderDetailsScreen } from '@/features/service-orders/ServiceOrderDetailsScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function ServiceOrderDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (!user || business.isLoading)
    return <LoadingScreen label="Carregando execução..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return (
    <ServiceOrderDetailsScreen
      businessId={business.data.id}
      orderId={id}
      userId={user.id}
    />
  );
}
