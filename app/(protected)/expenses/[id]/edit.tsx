import { useLocalSearchParams } from 'expo-router';
import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ExpenseFormScreen } from '@/features/expenses/ExpenseFormScreen';
import { useAuth } from '@/providers/AuthProvider';
export default function EditExpenseRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (!user || business.isLoading)
    return <LoadingScreen label="Carregando despesa..." />;
  if (!business.data || !id)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return (
    <ExpenseFormScreen
      businessId={business.data.id}
      expenseId={id}
      userId={user.id}
    />
  );
}
