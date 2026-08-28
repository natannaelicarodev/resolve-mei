import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  ConfirmationDialog,
  Icon,
  InlineFeedback,
  Screen,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { radii, spacing, useTheme } from '@/theme';
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
  const { colors } = useTheme();
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
      <View
        style={[
          styles.hero,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.copy}>
          <Text color="textSecondary" variant="caption">
            ORÇAMENTO
          </Text>
          <Text variant="cardTitle">
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
        <Text style={styles.heroTotal} variant="sectionTitle">
          {formatMoney(quote.total_cents)}
        </Text>
      </View>
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          CLIENTE E VALIDADE
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.clientRow}>
            <View
              style={[
                styles.iconTile,
                { backgroundColor: colors.primarySubtle },
              ]}
            >
              <Icon color="primary" name="client" size="small" />
            </View>
            <View style={styles.copy}>
              <Text variant="label">{quote.client_name_snapshot}</Text>
              {quote.client_phone_snapshot ? (
                <Text color="textSecondary" variant="caption">
                  {quote.client_phone_snapshot}
                </Text>
              ) : null}
              {quote.client_email_snapshot ? (
                <Text color="textSecondary" variant="caption">
                  {quote.client_email_snapshot}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={[styles.dateRow, { borderTopColor: colors.border }]}>
            <View>
              <Text color="textMuted" variant="caption">
                Emissão
              </Text>
              <Text variant="label">
                {formatDateForDisplay(quote.issued_on)}
              </Text>
            </View>
            <View>
              <Text color="textMuted" variant="caption">
                Validade
              </Text>
              <Text variant="label">
                {formatDateForDisplay(quote.valid_until)}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          ITENS DO ORÇAMENTO
        </Text>
        {quote.items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.item,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
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
      </View>
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          RESUMO FINANCEIRO
        </Text>
        <View
          style={[
            styles.totalCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.summaryRow}>
            <Text color="textSecondary">Subtotal</Text>
            <Text>{formatMoney(quote.subtotal_cents)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text color="textSecondary">Desconto</Text>
            <Text>{formatMoney(quote.discount_cents)}</Text>
          </View>
          <View
            style={[styles.summaryTotal, { borderTopColor: colors.border }]}
          >
            <Text variant="label">Total do orçamento</Text>
            <Text color="primary" variant="sectionTitle">
              {formatMoney(quote.total_cents)}
            </Text>
          </View>
        </View>
      </View>
      {quote.notes ? (
        <View style={styles.section}>
          <Text color="primary" style={styles.sectionTitle} variant="caption">
            OBSERVAÇÕES
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text color="textSecondary">{quote.notes}</Text>
          </View>
        </View>
      ) : null}
      {statusMutation.isError || duplicateMutation.isError ? (
        <InlineFeedback
          message="Não foi possível concluir a operação."
          variant="error"
        />
      ) : null}
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          AÇÕES
        </Text>
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
              next === 'canceled' || next === 'rejected'
                ? 'danger'
                : 'secondary'
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
      </View>
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
  hero: {
    alignItems: 'center',
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
  },
  heroTotal: { width: '100%' },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 14,
  },
  card: { borderRadius: radii.medium, borderWidth: 1, padding: spacing.md },
  clientRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  iconTile: {
    alignItems: 'center',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  dateRow: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    borderRadius: radii.medium,
    borderWidth: 1,
    padding: spacing.md,
  },
  totalCard: {
    borderRadius: radii.medium,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryTotal: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
});
