import { useLocalSearchParams } from 'expo-router';

import { ErrorFallback } from '@/components/ErrorFallback';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { ClientListScreen } from '@/features/clients/ClientListScreen';
import { useAuth } from '@/providers/AuthProvider';

export default function ClientsRoute() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  // A Home abre esta lista já filtrada por retomada, no lugar da tela separada
  // que existia antes. Qualquer outro valor cai no filtro padrão.
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  if (business.isLoading)
    return <LoadingScreen label="Carregando clientes..." />;
  if (!business.data)
    return <ErrorFallback onRetry={() => void business.refetch()} />;
  return (
    <ClientListScreen
      businessId={business.data.id}
      initialFilter={filter === 'reconnect' ? 'reconnect' : undefined}
    />
  );
}
