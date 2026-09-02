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
  SkeletonBlock,
  Text,
  Badge,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { FadeInView } from '@/components/motion';
import { formatBigIntMoney } from '@/features/receivables/domain';
import { useRelationshipOverview } from '@/features/relationships/hooks';
import { motion, spacing } from '@/theme';
import { setClientStatus } from './api';
import { openClientContact } from './contact';
import { formatClientDocument, formatPhone } from './format';
import { elapsedLabel } from './listFilter';
import { clientsQueryKey, useClient } from './hooks';
import { useAuth } from '@/providers/AuthProvider';
import { ClientRelationshipSection } from '@/features/relationships/ClientRelationshipSection';

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
  businessName,
  clientId,
}: {
  businessId: string;
  businessName?: string;
  clientId: string;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const query = useClient(userId, businessId, clientId);
  // Mesma chave da seção de relacionamento mais abaixo: o react-query serve as
  // duas com uma requisição só.
  const relationship = useRelationshipOverview(userId, businessId, clientId);
  const queryClient = useQueryClient();
  const [contactError, setContactError] = useState(false);
  const [statusConfirmationVisible, setStatusConfirmationVisible] =
    useState(false);
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
        <SkeletonBlock label="Carregando cliente" />
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
  return (
    <Screen safeAreaEdges={['top', 'bottom']}>
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback="/clients"
        dismissToBackFallback
        title="Detalhes do cliente"
      />
      {/* O resumo vem antes do cadastro porque a pergunta ao abrir um cliente
          é "quando foi a última vez e quanto já rendeu", não "qual o CPF".
          Consome a mesma consulta da seção de relacionamento abaixo, que o
          react-query deduplica — não há requisição a mais por isso. */}
      <FadeInView
        distance={motion.distance.medium}
        scaleFrom={motion.enterScale}
      >
        <Card style={styles.summary} variant="summary">
          <View style={styles.heading}>
            <View style={styles.headingCopy}>
              <Text color="textSecondary" variant="caption">
                {client.type === 'person' ? 'PESSOA' : 'EMPRESA'}
              </Text>
              <Text variant="sectionTitle">{client.name}</Text>
            </View>
            {client.status === 'active' ? null : (
              <Badge label="Inativo" variant="neutral" />
            )}
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text color="textSecondary" variant="caption">
                Último atendimento
              </Text>
              <Text variant="label">
                {relationship.data
                  ? elapsedLabel(relationship.data.daysSince ?? undefined)
                  : '—'}
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <Text color="textSecondary" variant="caption">
                Recebido
              </Text>
              <Text color="success" variant="label">
                {relationship.data
                  ? formatBigIntMoney(relationship.data.receivedCents)
                  : '—'}
              </Text>
            </View>
          </View>
        </Card>
      </FadeInView>
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
      <ClientRelationshipSection
        businessId={businessId}
        businessName={businessName ?? 'seu negócio'}
        client={{ id: client.id, name: client.name, phone: client.phone }}
        userId={userId}
      />
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
        onPress={() => setStatusConfirmationVisible(true)}
      />
      <ConfirmationDialog
        confirmLabel={nextStatus === 'inactive' ? 'Inativar' : 'Ativar'}
        description={`Confirma a alteração de status de ${client.name}?`}
        destructive={nextStatus === 'inactive'}
        loading={status.isPending}
        onCancel={() => setStatusConfirmationVisible(false)}
        onConfirm={() => {
          status.mutate(nextStatus);
          setStatusConfirmationVisible(false);
        }}
        title={`${nextStatus === 'inactive' ? 'Inativar' : 'Ativar'} cliente`}
        visible={statusConfirmationVisible}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.md },
  summaryStats: { flexDirection: 'row', gap: spacing.md },
  summaryStat: { flex: 1, gap: 2, minWidth: 0 },
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detail: { gap: 2 },
});
