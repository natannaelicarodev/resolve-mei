import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ServiceListScreen } from '@/features/services/ServiceListScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function ServicesRoute() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (business.isLoading)
    return <LoadingScreen label="Carregando serviços..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <ServiceListScreen businessId={business.data.id} />;
}
