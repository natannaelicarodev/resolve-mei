import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmationDialog,
  Icon,
  InlineFeedback,
  Screen,
  SkeletonBlock,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { FadeInView } from '@/components/motion';
import { motion, radii, spacing, useTheme } from '@/theme';
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
import { QuoteClientLinkSection } from './QuoteClientLinkSection';
import { QuoteServiceOrderSection } from '@/features/service-orders/QuoteServiceOrderSection';
import { QuoteReceivablesSection } from '@/features/receivables/QuoteReceivablesSection';
import { QuoteExpenseMarginSection } from '@/features/expenses/QuoteExpenseMarginSection';
import {
  loadQuoteDocumentForExport,
  previewQuoteDocument,
  shareQuoteDocument,
} from './pdf';

type PdfAction = 'preview' | 'share';

function isPrintCancellation(error: unknown) {
  return (
    error instanceof Error &&
    /cancel|closed without starting|printer picker/i.test(error.message)
  );
}

function pdfErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const nativeCause = error instanceof Error ? error.cause : null;
  const nativeMessage =
    nativeCause instanceof Error
      ? nativeCause.message
      : typeof nativeCause === 'object' && nativeCause !== null
        ? String('message' in nativeCause ? nativeCause.message : '')
        : '';
  const nativeCode =
    typeof nativeCause === 'object' &&
    nativeCause !== null &&
    'code' in nativeCause &&
    typeof nativeCause.code === 'string'
      ? nativeCause.code.replace(/[^A-Z0-9_-]/gi, '').slice(0, 48)
      : '';
  if (/SESSION_CHANGED|IDENTITY_MISMATCH/.test(message))
    return 'Sua sessão mudou. Abra o orçamento novamente antes de exportar.';
  if (/TOTALS_MISMATCH|ITEM_TOTAL_MISMATCH/.test(message))
    return 'Os valores salvos estão inconsistentes. Revise o orçamento antes de gerar o PDF.';
  if (/SHARING_UNAVAILABLE/.test(message))
    return 'O compartilhamento não está disponível neste dispositivo.';
  if (/SHARING_MODULE_FAILED/.test(message))
    return 'O módulo de compartilhamento não foi carregado. Reinicie ou atualize o aplicativo. [PDF-MÓDULO]';
  if (/GENERATION_FAILED/.test(message))
    return 'O Android não conseguiu gerar o arquivo. Tente visualizar o PDF primeiro. [PDF-GERAÇÃO]';
  if (/SHARE_SHEET_FAILED/.test(message))
    return /another share request|share.*progress/i.test(nativeMessage)
      ? 'Existe um compartilhamento anterior preso no Android. Feche totalmente o app e abra novamente. [PDF-EM-ANDAMENTO]'
      : /not allowed to read|only local file|file url/i.test(nativeMessage)
        ? 'O Android bloqueou o acesso ao arquivo temporário. [PDF-ARQUIVO]'
        : /activity|intent|resolve/i.test(nativeMessage)
          ? 'O Android não encontrou um aplicativo compatível para receber o PDF. [PDF-INTENT]'
          : `O arquivo foi gerado, mas o Android não abriu o menu de compartilhamento. [PDF-MENU${nativeCode ? `:${nativeCode}` : ''}]`;
  return 'Não foi possível preparar o PDF. Tente novamente.';
}

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
  const { width: windowWidth } = useWindowDimensions();
  const query = useQuote(userId, businessId, quoteId);
  const [pendingStatus, setPendingStatus] = useState<QuoteStatus | null>(null);
  const [confirmingDuplicate, setConfirmingDuplicate] = useState(false);
  const [pdfAction, setPdfAction] = useState<PdfAction | null>(null);
  const [lastFailedPdfAction, setLastFailedPdfAction] =
    useState<PdfAction | null>(null);
  const [pdfFeedback, setPdfFeedback] = useState<{
    message: string;
    variant: 'error' | 'info' | 'success';
  } | null>(null);
  const queryClient = useQueryClient();
  const mounted = useRef(true);
  const pdfLocked = useRef(false);
  const pdfAbort = useRef<AbortController | null>(null);
  const identity = `${userId}:${businessId}:${quoteId}`;
  const currentIdentity = useRef(identity);
  useEffect(() => {
    currentIdentity.current = identity;
  }, [identity]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pdfAbort.current?.abort();
    };
  }, []);
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
  const runPdfAction = async (action: PdfAction) => {
    if (pdfLocked.current) return;
    const expectedIdentity = identity;
    const controller = new AbortController();
    pdfLocked.current = true;
    pdfAbort.current?.abort();
    pdfAbort.current = controller;
    setPdfAction(action);
    setPdfFeedback(null);
    setLastFailedPdfAction(null);
    try {
      const document = await loadQuoteDocumentForExport(
        { businessId, quoteId, userId },
        controller.signal,
      );
      if (
        controller.signal.aborted ||
        !mounted.current ||
        currentIdentity.current !== expectedIdentity
      )
        return;
      if (action === 'preview') {
        await previewQuoteDocument(document, userId);
        if (mounted.current && currentIdentity.current === expectedIdentity)
          setPdfFeedback({
            message:
              Platform.OS === 'web'
                ? 'Use o diálogo do navegador para visualizar ou salvar o PDF.'
                : 'Prévia do orçamento aberta.',
            variant: 'info',
          });
      } else {
        const result = await shareQuoteDocument(document, userId);
        if (mounted.current && currentIdentity.current === expectedIdentity)
          setPdfFeedback({
            message:
              result === 'web-print-fallback'
                ? 'Use o diálogo do navegador para salvar o orçamento como PDF.'
                : 'PDF pronto para compartilhar.',
            variant: result === 'web-print-fallback' ? 'info' : 'success',
          });
      }
    } catch (error) {
      if (
        controller.signal.aborted ||
        !mounted.current ||
        currentIdentity.current !== expectedIdentity ||
        isPrintCancellation(error)
      )
        return;
      console.error('Quote PDF action failed', { action, error });
      setLastFailedPdfAction(action);
      setPdfFeedback({ message: pdfErrorMessage(error), variant: 'error' });
    } finally {
      if (pdfAbort.current === controller) pdfAbort.current = null;
      pdfLocked.current = false;
      if (mounted.current && currentIdentity.current === expectedIdentity)
        setPdfAction(null);
    }
  };
  const identityBand = (
    <View
      style={[
        styles.identityBand,
        { backgroundColor: colors.primary, width: windowWidth + 4 },
      ]}
    >
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback={'/quotes' as Href}
        dismissToBackFallback
        foregroundColor={colors.textInverse}
        title="Detalhes do orçamento"
      />
      <Text style={{ color: colors.textInverse }} variant="bodySmall">
        Acompanhe a proposta, compartilhe o PDF e avance cada etapa.
      </Text>
    </View>
  );
  if (query.isLoading)
    return (
      <Screen
        background="subtle"
        contentContainerStyle={styles.screenContent}
        safeAreaColor={colors.primary}
        safeAreaEdges={['top', 'bottom']}
        style={{ backgroundColor: colors.primary }}
      >
        <StatusBar style="light" />
        {identityBand}
        <SkeletonBlock label="Carregando orçamento" />
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen
        background="subtle"
        contentContainerStyle={styles.screenContent}
        safeAreaColor={colors.primary}
        safeAreaEdges={['top', 'bottom']}
        style={{ backgroundColor: colors.primary }}
      >
        <StatusBar style="light" />
        {identityBand}
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
      background="subtle"
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: colors.backgroundSubtle },
      ]}
      safeAreaColor={colors.primary}
      safeAreaEdges={['top', 'bottom']}
      style={{ backgroundColor: colors.primary }}
    >
      <StatusBar style="light" />
      {identityBand}
      <FadeInView
        distance={motion.distance.medium}
        scaleFrom={motion.enterScale}
      >
        <Card style={styles.hero} variant="elevated">
          <View style={styles.heroHeading}>
            <View
              style={[
                styles.heroIcon,
                { backgroundColor: colors.primarySubtle },
              ]}
            >
              <Icon color="primary" name="quote" size="large" />
            </View>
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
          </View>
          <Text color="textSecondary" variant="caption">
            VALOR TOTAL
          </Text>
          <Text
            accessibilityLabel={`Valor total: ${formatMoney(quote.total_cents)}`}
            color="primary"
            style={styles.heroTotal}
            variant="financial"
          >
            {formatMoney(quote.total_cents)}
          </Text>
        </Card>
      </FadeInView>
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          CLIENTE E VALIDADE
        </Text>
        <Card>
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
          <View
            style={[styles.dateRow, { borderTopColor: colors.borderSubtle }]}
          >
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
        </Card>
      </View>
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          ITENS DO ORÇAMENTO
        </Text>
        {quote.items.map((item) => (
          <Card key={item.id} style={styles.item}>
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
          </Card>
        ))}
      </View>
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          RESUMO FINANCEIRO
        </Text>
        <Card style={styles.totalCard} variant="summary">
          <View style={styles.summaryRow}>
            <Text color="textSecondary">Subtotal</Text>
            <Text>{formatMoney(quote.subtotal_cents)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text color="textSecondary">Desconto</Text>
            <Text>{formatMoney(quote.discount_cents)}</Text>
          </View>
          <View
            style={[
              styles.summaryTotal,
              { borderTopColor: colors.borderSubtle },
            ]}
          >
            <Text variant="label">Total do orçamento</Text>
            <Text color="primary" variant="sectionTitle">
              {formatMoney(quote.total_cents)}
            </Text>
          </View>
        </Card>
      </View>
      {quote.notes ? (
        <View style={styles.section}>
          <Text color="primary" style={styles.sectionTitle} variant="caption">
            OBSERVAÇÕES
          </Text>
          <Card>
            <Text color="textSecondary">{quote.notes}</Text>
          </Card>
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
          PDF DO ORÇAMENTO
        </Text>
        <Text color="textSecondary" variant="caption">
          O documento inclui os dados do cliente, os serviços e os valores
          salvos neste orçamento.
        </Text>
        {pdfFeedback ? (
          <InlineFeedback
            message={pdfFeedback.message}
            variant={pdfFeedback.variant}
          />
        ) : null}
        <View style={styles.pdfActions}>
          <Button
            disabled={pdfAction !== null}
            icon={<Icon color="primary" name="preview" size="small" />}
            label="Visualizar PDF"
            loading={pdfAction === 'preview'}
            onPress={() => void runPdfAction('preview')}
            style={styles.pdfAction}
            variant="secondary"
          />
          <Button
            disabled={pdfAction !== null}
            icon={
              <Icon
                color="textInverse"
                name={Platform.OS === 'web' ? 'download' : 'share'}
                size="small"
              />
            }
            label={
              Platform.OS === 'web'
                ? 'Salvar ou imprimir PDF'
                : 'Compartilhar PDF'
            }
            loading={pdfAction === 'share'}
            onPress={() => void runPdfAction('share')}
            style={styles.pdfAction}
          />
        </View>
        {lastFailedPdfAction ? (
          <Button
            label="Tentar novamente"
            onPress={() => void runPdfAction(lastFailedPdfAction)}
            variant="ghost"
          />
        ) : null}
      </View>
      <QuoteClientLinkSection
        businessId={businessId}
        key={`${userId}:${businessId}:${quoteId}`}
        quoteId={quoteId}
        quoteStatus={quote.status}
        userId={userId}
      />
      <QuoteServiceOrderSection
        businessId={businessId}
        quoteId={quoteId}
        quoteStatus={quote.status}
        userId={userId}
      />
      <QuoteReceivablesSection
        businessId={businessId}
        quoteId={quoteId}
        quoteStatus={quote.status}
        userId={userId}
      />
      <QuoteExpenseMarginSection
        businessId={businessId}
        quoteId={quoteId}
        userId={userId}
      />
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          AÇÕES DO ORÇAMENTO
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
  identityBand: {
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: -spacing.md,
    minHeight: 168,
    paddingBottom: 56,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    gap: spacing.sm,
    marginTop: -64,
  },
  heroHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroIcon: {
    alignItems: 'center',
    borderRadius: radii.control,
    height: 52,
    justifyContent: 'center',
    width: 52,
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
  pdfActions: { gap: spacing.sm },
  pdfAction: { width: '100%' },
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
  item: { alignItems: 'center', flexDirection: 'row' },
  totalCard: { gap: spacing.sm },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  summaryTotal: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.md,
  },
});
