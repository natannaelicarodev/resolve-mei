import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  ConfirmationDialog,
  Icon,
  InlineFeedback,
  Screen,
  Text,
  Badge,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { radii, spacing, useTheme } from '@/theme';
import { setClientStatus } from './api';
import { openClientContact } from './contact';
import { formatClientDocument, formatPhone } from './format';
import { clientsQueryKey, useClient } from './hooks';
import { useAuth } from '@/providers/AuthProvider';

function Detail({
  icon,
  label,
  value,
}: {
  icon: 'client' | 'phone' | 'email' | 'quote';
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <View style={styles.detail}>
      <View style={styles.detailIcon}>
        <Icon color="primary" name={icon} size="small" />
      </View>
      <View style={styles.detailCopy}>
        <Text color="textMuted" variant="caption">
          {label}
        </Text>
        <Text variant="label">{value}</Text>
      </View>
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
  const { colors } = useTheme();
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
    <Screen
      contentContainerStyle={styles.screenContent}
      safeAreaEdges={['top', 'bottom']}
    >
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback="/clients"
        dismissToBackFallback
        title="Detalhes do cliente"
      />
      <View
        style={[
          styles.hero,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text color="textOnPrimary" variant="cardTitle">
            {client.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headingCopy}>
          <Text variant="cardTitle">{client.name}</Text>
          <Text color="textSecondary" variant="caption">
            {client.type === 'person' ? 'Pessoa' : 'Empresa'}
          </Text>
        </View>
        <Badge
          label={client.status === 'active' ? 'Ativo' : 'Inativo'}
          variant={client.status === 'active' ? 'success' : 'neutral'}
        />
      </View>
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          CONTATO RÁPIDO
        </Text>
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
      </View>
      {contactError ? (
        <InlineFeedback
          variant="error"
          message="Não foi possível abrir o aplicativo de contato neste dispositivo."
        />
      ) : null}
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          INFORMAÇÕES
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Detail
            icon="client"
            label={client.type === 'person' ? 'CPF' : 'CNPJ'}
            value={
              client.document
                ? formatClientDocument(client.document, client.type)
                : null
            }
          />
          <Detail
            icon="phone"
            label="Telefone"
            value={client.phone ? formatPhone(client.phone) : null}
          />
          <Detail icon="email" label="E-mail" value={client.email} />
          <Detail icon="quote" label="Observações" value={client.notes} />
          {!client.document &&
          !client.phone &&
          !client.email &&
          !client.notes ? (
            <Text color="textSecondary">Nenhuma informação adicional.</Text>
          ) : null}
        </View>
      </View>
      {status.isError ? (
        <InlineFeedback
          variant="error"
          message="Não foi possível alterar o status."
        />
      ) : null}
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          AÇÕES
        </Text>
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
      </View>
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
  screenContent: { paddingHorizontal: spacing.lg },
  hero: {
    alignItems: 'center',
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headingCopy: { flex: 1, gap: spacing.xs },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 14,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    borderRadius: radii.medium,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  detail: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm,
  },
  detailIcon: { alignItems: 'center', justifyContent: 'center', width: 24 },
  detailCopy: { flex: 1, gap: 2, minWidth: 0 },
});
