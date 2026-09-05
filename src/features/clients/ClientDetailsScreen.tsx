import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  Button,
  Card,
  ConfirmationDialog,
  InlineFeedback,
  Screen,
  SkeletonBlock,
  Text,
  Badge,
  Icon,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { FadeInView } from '@/components/motion';
import { formatBigIntMoney } from '@/features/receivables/domain';
import { useRelationshipOverview } from '@/features/relationships/hooks';
import { motion, radii, spacing, useTheme } from '@/theme';
import { setClientStatus } from './api';
import { openClientContact } from './contact';
import { formatClientDocument, formatPhone } from './format';
import { elapsedLabel } from './listFilter';
import { clientsQueryKey, useClient } from './hooks';
import { useAuth } from '@/providers/AuthProvider';
import { ClientRelationshipSection } from '@/features/relationships/ClientRelationshipSection';

function Detail({ label, value }: { label: string; value?: string | null }) {
  const { colors } = useTheme();
  if (!value) return null;
  return (
    <View style={[styles.detail, { borderBottomColor: colors.borderSubtle }]}>
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
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
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
    <Screen
      background="subtle"
      contentContainerStyle={[
        styles.content,
        { backgroundColor: colors.backgroundSubtle },
      ]}
      safeAreaColor={colors.primary}
      safeAreaEdges={['top', 'bottom']}
      style={{ backgroundColor: colors.primary }}
    >
      <StatusBar style="light" />
      <View
        style={[
          styles.identityBand,
          { backgroundColor: colors.primary, width: windowWidth + 4 },
        ]}
      >
        <ProtectedPageHeader
          alwaysUseBackFallback
          back
          backFallback="/clients"
          dismissToBackFallback
          foregroundColor={colors.textInverse}
          title="Detalhes do cliente"
        />
        <Text style={{ color: colors.textInverse }} variant="bodySmall">
          Contato, histórico e informações do relacionamento em um só lugar.
        </Text>
      </View>
      {/* O resumo vem antes do cadastro porque a pergunta ao abrir um cliente
          é "quando foi a última vez e quanto já rendeu", não "qual o CPF".
          Consome a mesma consulta da seção de relacionamento abaixo, que o
          react-query deduplica — não há requisição a mais por isso. */}
      <FadeInView
        distance={motion.distance.medium}
        scaleFrom={motion.enterScale}
      >
        <Card style={styles.summary} variant="elevated">
          <View style={styles.heading}>
            <View
              style={[styles.avatar, { backgroundColor: colors.primarySubtle }]}
            >
              <Text color="primary" variant="sectionTitle">
                {client.name.trim().charAt(0).toLocaleUpperCase('pt-BR')}
              </Text>
            </View>
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
            <View
              style={[
                styles.summaryStat,
                { backgroundColor: colors.backgroundSubtle },
              ]}
            >
              <Icon color="primary" name="duration" size="small" />
              <View style={styles.statCopy}>
                <Text color="textSecondary" variant="caption">
                  Último atendimento
                </Text>
                <Text variant="label">
                  {relationship.data
                    ? elapsedLabel(relationship.data.daysSince ?? undefined)
                    : '—'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.summaryStat,
                { backgroundColor: colors.successSurface },
              ]}
            >
              <Icon color="success" name="money" size="small" />
              <View style={styles.statCopy}>
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
          </View>
        </Card>
      </FadeInView>
      <View style={styles.quickActions}>
        {client.phone ? (
          <>
            <Button
              icon={<Icon color="primary" name="phone" size="small" />}
              label="Ligar"
              size="small"
              style={styles.quickAction}
              variant="secondary"
              onPress={() => void contact('phone', client.phone!)}
            />
            <Button
              icon={<Icon color="primary" name="whatsapp" size="small" />}
              label="WhatsApp"
              size="small"
              style={styles.quickAction}
              variant="secondary"
              onPress={() => void contact('whatsapp', client.phone!)}
            />
          </>
        ) : null}
        {client.email ? (
          <Button
            icon={<Icon color="primary" name="email" size="small" />}
            label="E-mail"
            size="small"
            style={styles.quickAction}
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
      <Card title="Informações" variant="elevated">
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
      <View style={styles.footerActions}>
        <Button
          haptic="selection"
          icon={<Icon name="edit" rawColor={colors.textInverse} size="small" />}
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
      </View>
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
  content: { paddingHorizontal: spacing.lg },
  identityBand: {
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: -spacing.md,
    minHeight: 168,
    paddingBottom: 56,
    paddingHorizontal: spacing.lg,
  },
  summary: { gap: spacing.md, marginTop: -64 },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  summaryStats: { flexDirection: 'row', gap: spacing.md },
  summaryStat: {
    alignItems: 'flex-start',
    borderRadius: radii.control,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 72,
    padding: spacing.sm,
  },
  statCopy: { flex: 1, gap: 2, minWidth: 0 },
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.xs },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickAction: { flexGrow: 1, minWidth: 96 },
  detail: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  footerActions: { gap: spacing.sm },
});
