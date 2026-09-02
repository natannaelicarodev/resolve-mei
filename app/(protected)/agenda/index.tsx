import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AgendaScreen } from '@/features/agenda/AgendaScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { useAuth } from '@/providers/AuthProvider';

export default function AgendaRoute() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (!user || business.isLoading) return <LoadingScreen label="Carregando agenda..." />;
  if (!business.data) return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <AgendaScreen businessId={business.data.id} userId={user.id} />;
}
