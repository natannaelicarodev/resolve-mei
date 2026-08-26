import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { QuoteListScreen } from '@/features/quotes/QuoteListScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function QuotesRoute() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (business.isLoading)
    return <LoadingScreen label="Carregando orçamentos..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <QuoteListScreen businessId={business.data.id} />;
}
