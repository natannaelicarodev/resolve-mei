import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ResultScreen } from '@/features/expenses/ResultScreen';
import { useAuth } from '@/providers/AuthProvider';
export default function ResultRoute() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (!user || business.isLoading)
    return <LoadingScreen label="Calculando resultado..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <ResultScreen businessId={business.data.id} businessName={business.data.business_name} userId={user.id} />;
}
