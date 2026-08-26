import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ClientFormScreen } from '@/features/clients/ClientFormScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function NewClientRoute() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (business.isLoading)
    return <LoadingScreen label="Preparando cadastro..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <ClientFormScreen businessId={business.data.id} />;
}
