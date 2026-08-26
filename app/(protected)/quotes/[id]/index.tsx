import { useLocalSearchParams } from 'expo-router';
import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { QuoteDetailsScreen } from '@/features/quotes/QuoteDetailsScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function QuoteDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (!user || business.isLoading)
    return <LoadingScreen label="Carregando orçamento..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return (
    <QuoteDetailsScreen
      businessId={business.data.id}
      quoteId={id}
      userId={user.id}
    />
  );
}
