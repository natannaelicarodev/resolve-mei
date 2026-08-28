import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  ConfirmationDialog,
  FormSection,
  Icon,
  InlineFeedback,
  Screen,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { spacing } from '@/theme';
import { duplicateQuote, transitionQuote } from './api';
import {
  allowedQuoteTransitions,
  canEditQuote,
  formatMoney,
  formatQuoteNumber,
  getDisplayQuoteStatus,
  quoteStatusLabels,
} from './domain';
import type { QuoteStatus } from './domain';
import { formatDateForDisplay } from './date';
import { quotesQueryKey, useQuote } from './hooks';

const actionLabels: Partial<Record<QuoteStatus, string>> = {
  sent: 'Marcar como enviado',
  approved: 'Aprovar',
  rejected: 'Recusar',
  canceled: 'Cancelar',
};

export function QuoteDetailsScreen({
  userId,
  businessId,
  quoteId,
}: {
  userId: string;
  businessId: string;
  quoteId: string;
}) {
  const query = useQuote(userId, businessId, quoteId);
  const [pendingStatus, setPendingStatus] = useState<QuoteStatus | null>(null);
  const [confirmingDuplicate, setConfirmingDuplicate] = useState(false);
  const queryClient = useQueryClient();
  const mounted = useRef(true);
  const identity = `${userId}:${businessId}:${quoteId}`;
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: quotesQueryKey(userId, businessId),
    });
  const statusMutation = useMutation({
    mutationFn: ({
      status,
      expectedIdentity,
    }: {
      status: QuoteStatus;
      expectedIdentity: string;
    }) => {
      if (!mounted.current || expectedIdentity !== identity)
        throw new Error('QUOTE_SESSION_CHANGED');
      return transitionQuote(businessId, quoteId, status);
    },
    onSuccess: (saved, variables) => {
      if (
        !mounted.current ||
        variables.expectedIdentity !== identity ||
        saved.business_id !== businessId ||
        saved.id !== quoteId
      )
        return;
      void invalidate();
    },
  });
  const duplicateMutation = useMutation({
    mutationFn: (expectedIdentity: string) => {
      if (!mounted.current || expectedIdentity !== identity)
        throw new Error('QUOTE_SESSION_CHANGED');
      return duplicateQuote(businessId, quoteId);
    },
    onSuccess: (copy, expectedIdentity) => {
      if (
        !mounted.current ||
        expectedIdentity !== identity ||
        copy.business_id !== businessId
      )
        return;
      void invalidate();
      router.replace({
        pathname: '/quotes/[id]/edit',
        params: { id: copy.id },
      });
    },
  });
  const header = (
    <ProtectedPageHeader
      alwaysUseBackFallback
      back
      backFallback={'/quotes' as Href}
      dismissToBackFallback
      title="Detalhes do orçamento"
    />
  );
  if (query.isLoading)
    return (
      <Screen safeAreaEdges={['top', 'bottom']}>
        {header}
        <Text>Carregando orçamento...</Text>
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen safeAreaEdges={['top', 'bottom']}>
        {header}
        <InlineFeedback
          message="Não foi possível carregar este orçamento."
          variant="error"
        />
        <Button
          label="Tentar novamente"
          onPress={() => void query.refetch()}
          variant="secondary"
        />
      </Screen>
    );
  const quote = query.data;
  const displayStatus = getDisplayQuoteStatus(quote.status, quote.valid_until);
  const destructiveTransition =
    pendingStatus === 'canceled' || pendingStatus === 'rejected';
  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      safeAreaEdges={['top', 'bottom']}
    >
      {header}
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Text variant="sectionTitle">
            Orçamento #{formatQuoteNumber(quote.quote_number)}
          </Text>
          <Text color="textSecondary">{quote.client_name_snapshot}</Text>
        </View>
        <Badge
          label={quoteStatusLabels[displayStatus]}
          variant={
            displayStatus === 'approved'
              ? 'success'
              : displayStatus === 'rejected' || displayStatus === 'canceled'
                ? 'danger'
                : 'neutral'
          }
        />
      </View>
      <FormSection compact icon={<Icon name="client" />} title="Cliente">
        <Text>{quote.client_name_snapshot}</Text>
        {quote.client_phone_snapshot ? (
          <Text color="textSecondary">{quote.client_phone_snapshot}</Text>
        ) : null}
        {quote.client_email_snapshot ? (
          <Text color="textSecondary">{quote.client_email_snapshot}</Text>
        ) : null}
        <Text color="textSecondary">
          Emissão: {formatDateForDisplay(quote.issued_on)}
        </Text>
        <Text color="textSecondary">
          Validade: {formatDateForDisplay(quote.valid_until)}
        </Text>
      </FormSection>
      <FormSection compact icon={<Icon name="service" />} title="Itens">
        {quote.items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.copy}>
              <Text variant="label">{item.name_snapshot}</Text>
              {item.description_snapshot ? (
                <Text color="textSecondary" variant="caption">
                  {item.description_snapshot}
                </Text>
              ) : null}
              <Text color="textSecondary" variant="caption">
                {item.quantity} × {formatMoney(item.unit_price_cents)}
              </Text>
            </View>
            <Text>{formatMoney(item.item_total_cents)}</Text>
          </View>
        ))}
      </FormSection>
      <FormSection
        compact
        icon={<Icon name="money" />}
        title="Resumo financeiro"
      >
        <Text>Subtotal: {formatMoney(quote.subtotal_cents)}</Text>
        <Text>Desconto: {formatMoney(quote.discount_cents)}</Text>
        <Text variant="sectionTitle">
          Total: {formatMoney(quote.total_cents)}
        </Text>
        {quote.notes ? <Text color="textSecondary">{quote.notes}</Text> : null}
      </FormSection>
      {statusMutation.isError || duplicateMutation.isError ? (
        <InlineFeedback
          message="Não foi possível concluir a operação."
          variant="error"
        />
      ) : null}
      {canEditQuote(quote.status) ? (
        <Button
          label="Editar orçamento"
          onPress={() =>
            router.push({
              pathname: '/quotes/[id]/edit',
              params: { id: quote.id },
            })
          }
        />
      ) : null}
      {(displayStatus === 'expired'
        ? []
        : allowedQuoteTransitions[quote.status]
      ).map((next) => (
        <Button
          key={next}
          disabled={statusMutation.isPending}
          label={actionLabels[next] ?? quoteStatusLabels[next]}
          onPress={() => setPendingStatus(next)}
          variant={
            next === 'canceled' || next === 'rejected' ? 'danger' : 'secondary'
          }
        />
      ))}
      <Button
        disabled={duplicateMutation.isPending}
        loading={duplicateMutation.isPending}
        label="Duplicar orçamento"
        onPress={() => setConfirmingDuplicate(true)}
        variant="secondary"
      />
      <ConfirmationDialog
        cancelLabel="Voltar"
        confirmLabel={
          pendingStatus
            ? (actionLabels[pendingStatus] ?? quoteStatusLabels[pendingStatus])
            : ''
        }
        description={
          pendingStatus
            ? `Confirma a alteração para ${quoteStatusLabels[pendingStatus]}?`
            : ''
        }
        destructive={destructiveTransition}
        loading={statusMutation.isPending}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => {
          if (!pendingStatus) return;
          setPendingStatus(null);
          statusMutation.mutate({
            status: pendingStatus,
            expectedIdentity: identity,
          });
        }}
        title={
          pendingStatus
            ? (actionLabels[pendingStatus] ?? 'Alterar status')
            : 'Alterar status'
        }
        visible={pendingStatus !== null}
      />
      <ConfirmationDialog
        cancelLabel="Voltar"
        confirmLabel="Duplicar orçamento"
        description="Uma nova cópia será criada como rascunho para revisão."
        loading={duplicateMutation.isPending}
        onCancel={() => setConfirmingDuplicate(false)}
        onConfirm={() => {
          setConfirmingDuplicate(false);
          duplicateMutation.mutate(identity);
        }}
        title="Duplicar orçamento"
        visible={confirmingDuplicate}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.lg },
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
});
