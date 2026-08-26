import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ClientListScreen } from '@/features/clients/ClientListScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function ClientsRoute() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (business.isLoading)
    return <LoadingScreen label="Carregando clientes..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <ClientListScreen businessId={business.data.id} />;
}
