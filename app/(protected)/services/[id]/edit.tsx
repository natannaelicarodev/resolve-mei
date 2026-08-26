import { useLocalSearchParams } from 'expo-router';

import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ServiceFormScreen } from '@/features/services/ServiceFormScreen';
import { useService } from '@/features/services/hooks';
import { useAuth } from '@/providers/AuthProvider';

export default function EditServiceRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const business = useMyBusiness(userId);
  const service = useService(userId, business.data?.id ?? '', id ?? '');
  if (business.isLoading || service.isLoading)
    return <LoadingScreen label="Carregando serviço..." />;
  if (!business.data || !service.data)
    return <ErrorFallback onRetry={() => void service.refetch()} />;
  return (
    <ServiceFormScreen businessId={business.data.id} service={service.data} />
  );
}
