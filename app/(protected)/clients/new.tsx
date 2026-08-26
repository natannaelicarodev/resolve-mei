import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ClientFormScreen } from '@/features/clients/ClientFormScreen';

export default function NewClientRoute() {
  const business = useMyBusiness();
  if (business.isLoading)
    return <LoadingScreen label="Preparando cadastro..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <ClientFormScreen businessId={business.data.id} />;
}
