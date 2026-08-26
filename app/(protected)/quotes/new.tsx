import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { QuoteFormScreen } from '@/features/quotes/QuoteFormScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function NewQuoteRoute() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (!user || business.isLoading)
    return <LoadingScreen label="Preparando orçamento..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <QuoteFormScreen businessId={business.data.id} userId={user.id} />;
}
