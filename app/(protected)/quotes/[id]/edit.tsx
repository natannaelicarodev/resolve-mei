import { useLocalSearchParams } from 'expo-router';
import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { canEditQuote } from '@/features/quotes/domain';
import { useQuote } from '@/features/quotes/hooks';
import { QuoteFormScreen } from '@/features/quotes/QuoteFormScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function EditQuoteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  const quote = useQuote(user?.id ?? '', business.data?.id ?? '', id);
  if (!user || business.isLoading || quote.isLoading)
    return <LoadingScreen label="Carregando orçamento..." />;
  if (!business.data || !quote.data || !canEditQuote(quote.data.status))
    return <ErrorFallback onRetry={() => void quote.refetch()} />;
  return (
    <QuoteFormScreen
      businessId={business.data.id}
      quote={quote.data}
      userId={user.id}
    />
  );
}
