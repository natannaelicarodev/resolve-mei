import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ExpenseListScreen } from '@/features/expenses/ExpenseListScreen';
import { useAuth } from '@/providers/AuthProvider';
export default function ExpenseListRoute() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (!user || business.isLoading)
    return <LoadingScreen label="Carregando despesas..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return <ExpenseListScreen businessId={business.data.id} userId={user.id} />;
}
