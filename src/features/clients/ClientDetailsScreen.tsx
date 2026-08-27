import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  ConfirmationDialog,
  InlineFeedback,
  Screen,
  Text,
  Badge,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { spacing } from '@/theme';
import { setClientStatus } from './api';
import { openClientContact } from './contact';
import { formatClientDocument, formatPhone } from './format';
import { clientsQueryKey, useClient } from './hooks';
import { useAuth } from '@/providers/AuthProvider';

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.detail}>
      <Text color="textSecondary" variant="caption">
        {label}
      </Text>
      <Text>{value}</Text>
    </View>
  );
}

export function ClientDetailsScreen({
  businessId,
  clientId,
}: {
  businessId: string;
  clientId: string;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const query = useClient(userId, businessId, clientId);
  const queryClient = useQueryClient();
  const [contactError, setContactError] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState(false);
  const status = useMutation({
    mutationFn: (next: 'active' | 'inactive') =>
      setClientStatus(businessId, clientId, next),
    onSuccess: async (saved) => {
      queryClient.setQueryData(
        [...clientsQueryKey(userId, businessId), 'detail', clientId],
        saved,
      );
      await queryClient.invalidateQueries({
        queryKey: clientsQueryKey(userId, businessId),
      });
    },
  });
  if (query.isLoading)
    return (
      <Screen safeAreaEdges={['top', 'bottom']}>
        <ProtectedPageHeader
          alwaysUseBackFallback
          back
          backFallback="/clients"
          dismissToBackFallback
          title="Cliente"
        />
        <Text>Carregando cliente...</Text>
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen safeAreaEdges={['top', 'bottom']}>
        <ProtectedPageHeader
          alwaysUseBackFallback
          back
          backFallback="/clients"
          dismissToBackFallback
          title="Cliente"
        />
        <InlineFeedback
          variant="error"
          message="Não foi possível carregar este cliente."
        />
        <Button label="Tentar novamente" onPress={() => void query.refetch()} />
      </Screen>
    );
  const client = query.data;
  const contact = async (
    kind: 'phone' | 'whatsapp' | 'email',
    value: string,
  ) => {
    try {
      setContactError(false);
      await openClientContact(kind, value);
    } catch {
      setContactError(true);
    }
  };
  const nextStatus = client.status === 'active' ? 'inactive' : 'active';
  const deactivating = nextStatus === 'inactive';
  return (
    <Screen safeAreaEdges={['top', 'bottom']}>
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback="/clients"
        dismissToBackFallback
        title="Detalhes do cliente"
      />
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text variant="sectionTitle">{client.name}</Text>
          <Text color="textSecondary">
            {client.type === 'person' ? 'Pessoa' : 'Empresa'}
          </Text>
        </View>
        <Badge
          label={client.status === 'active' ? 'Ativo' : 'Inativo'}
          variant={client.status === 'active' ? 'success' : 'neutral'}
        />
      </View>
      <View style={styles.actions}>
        {client.phone ? (
          <>
            <Button
              label="Ligar"
              size="small"
              variant="secondary"
              onPress={() => void contact('phone', client.phone!)}
            />
            <Button
              label="WhatsApp"
              size="small"
              variant="secondary"
              onPress={() => void contact('whatsapp', client.phone!)}
            />
          </>
        ) : null}
        {client.email ? (
          <Button
            label="E-mail"
            size="small"
            variant="secondary"
            onPress={() => void contact('email', client.email!)}
          />
        ) : null}
      </View>
      {contactError ? (
        <InlineFeedback
          variant="error"
          message="Não foi possível abrir o aplicativo de contato neste dispositivo."
        />
      ) : null}
      <Card>
        <Text variant="cardTitle">Informações</Text>
        <Detail
          label={client.type === 'person' ? 'CPF' : 'CNPJ'}
          value={
            client.document
              ? formatClientDocument(client.document, client.type)
              : null
          }
        />
        <Detail
          label="Telefone"
          value={client.phone ? formatPhone(client.phone) : null}
        />
        <Detail label="E-mail" value={client.email} />
        <Detail label="Observações" value={client.notes} />
        {!client.document && !client.phone && !client.email && !client.notes ? (
          <Text color="textSecondary">Nenhuma informação adicional.</Text>
        ) : null}
      </Card>
      {status.isError ? (
        <InlineFeedback
          variant="error"
          message="Não foi possível alterar o status."
        />
      ) : null}
      <Button
        label="Editar cliente"
        onPress={() =>
          router.push({
            pathname: '/clients/[id]/edit',
            params: { id: client.id },
          })
        }
      />
      <Button
        label={
          client.status === 'active' ? 'Inativar cliente' : 'Ativar cliente'
        }
        loading={status.isPending}
        variant={client.status === 'active' ? 'danger' : 'secondary'}
        onPress={() => setConfirmingStatus(true)}
      />
      <ConfirmationDialog
        confirmLabel={deactivating ? 'Inativar cliente' : 'Ativar cliente'}
        description={`Confirma a alteração de status de ${client.name}?`}
        destructive={deactivating}
        loading={status.isPending}
        onCancel={() => setConfirmingStatus(false)}
        onConfirm={() => {
          setConfirmingStatus(false);
          status.mutate(nextStatus);
        }}
        title={`${deactivating ? 'Inativar' : 'Ativar'} cliente`}
        visible={confirmingStatus}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detail: { gap: 2 },
});
