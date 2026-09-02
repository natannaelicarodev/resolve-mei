import { useLocalSearchParams } from 'expo-router';
import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ExpenseFormScreen } from '@/features/expenses/ExpenseFormScreen';
import { useAuth } from '@/providers/AuthProvider';
export default function NewExpenseRoute() {
  const { duplicate } = useLocalSearchParams<{ duplicate?: string }>();
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  if (!user || business.isLoading)
    return <LoadingScreen label="Preparando despesa..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return (
    <ExpenseFormScreen
      businessId={business.data.id}
      duplicateExpenseId={duplicate}
      userId={user.id}
    />
  );
}
