import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Share, StyleSheet, View } from 'react-native';
import { useRef, useState } from 'react';

import {
  Button,
  ConfirmationDialog,
  Icon,
  InlineFeedback,
  Text,
} from '@/components/ui';
import { radii, spacing, useTheme } from '@/theme';
import type { QuoteStatus } from './domain';
import { quotesQueryKey } from './hooks';
import {
  buildPublicQuoteUrl,
  getOwnerLinkState,
  hasPublicQuoteBaseUrl,
  issuePublicQuoteLink,
  revokePublicQuoteLink,
} from './publicLink';

type Confirmation = 'issue' | 'regenerate' | 'revoke' | null;

function formatTimestamp(value?: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function QuoteClientLinkSection({
  businessId,
  quoteId,
  quoteStatus,
  userId,
}: {
  businessId: string;
  quoteId: string;
  quoteStatus: QuoteStatus;
  userId: string;
}) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const identity = `${userId}:${businessId}:${quoteId}`;
  const identityRef = useRef(identity);
  const busyRef = useRef(false);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [busy, setBusy] = useState(false);
  const [ephemeralUrl, setEphemeralUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    message: string;
    variant: 'error' | 'info' | 'success' | 'warning';
  } | null>(null);
  const stateQuery = useQuery({
    enabled: Boolean(userId && businessId && quoteId),
    queryFn: () => getOwnerLinkState(quoteId),
    queryKey: [...quotesQueryKey(userId, businessId), 'public-link', quoteId],
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: quotesQueryKey(userId, businessId),
      }),
      queryClient.invalidateQueries({
        queryKey: ['private', userId, 'home', businessId],
      }),
      stateQuery.refetch(),
    ]);
  };

  const runIssue = async () => {
    if (busyRef.current || !hasPublicQuoteBaseUrl()) return;
    const expectedIdentity = identity;
    busyRef.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const issued = await issuePublicQuoteLink(quoteId);
      if (identityRef.current !== expectedIdentity) return;
      const url = buildPublicQuoteUrl(issued.token);
      if (!url) throw new Error('PUBLIC_QUOTE_URL_NOT_CONFIGURED');
      setEphemeralUrl(url);
      setFeedback({
        message:
          'Link criado. Copie ou compartilhe agora; ele não será armazenado no aparelho.',
        variant: 'success',
      });
      await refresh();
    } catch {
      if (identityRef.current === expectedIdentity)
        setFeedback({
          message: 'Não foi possível disponibilizar o link. Tente novamente.',
          variant: 'error',
        });
    } finally {
      busyRef.current = false;
      if (identityRef.current === expectedIdentity) setBusy(false);
    }
  };

  const runRevoke = async () => {
    if (busyRef.current) return;
    const expectedIdentity = identity;
    busyRef.current = true;
    setBusy(true);
    try {
      await revokePublicQuoteLink(quoteId);
      if (identityRef.current !== expectedIdentity) return;
      setEphemeralUrl(null);
      setFeedback({
        message: 'Acesso revogado imediatamente.',
        variant: 'success',
      });
      await refresh();
    } catch {
      if (identityRef.current === expectedIdentity)
        setFeedback({
          message: 'Não foi possível revogar o link.',
          variant: 'error',
        });
    } finally {
      busyRef.current = false;
      if (identityRef.current === expectedIdentity) setBusy(false);
    }
  };

  const state = stateQuery.data;
  const canIssue = quoteStatus === 'draft' || quoteStatus === 'sent';
  const hostConfigured = hasPublicQuoteBaseUrl();
  const decision = state?.decision;

  return (
    <View style={styles.section}>
      <Text color="primary" variant="caption">
        LINK DO CLIENTE
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        ]}
      >
        <View style={styles.heading}>
          <View
            style={[styles.icon, { backgroundColor: colors.primarySubtle }]}
          >
            <Icon color="primary" name="link" size="small" />
          </View>
          <View style={styles.copy}>
            <Text variant="label">
              {decision
                ? decision.value === 'approved'
                  ? 'Aprovado pelo link'
                  : 'Recusado pelo link'
                : state?.state === 'active'
                  ? 'Link ativo'
                  : state?.state === 'expired'
                    ? 'Link expirado'
                    : state?.state === 'revoked'
                      ? 'Link revogado'
                      : 'Ainda não disponibilizado'}
            </Text>
            {state?.expiresAt ? (
              <Text color="textSecondary" variant="caption">
                Válido até {formatTimestamp(state.expiresAt)} · versão{' '}
                {state.version}
              </Text>
            ) : null}
          </View>
        </View>

        <InlineFeedback
          message="Compartilhe apenas com o cliente. Quem tiver este link poderá visualizar e responder ao orçamento."
          variant="warning"
        />

        {!hostConfigured ? (
          <InlineFeedback
            message="Configure a URL HTTPS da página do cliente antes de gerar links."
            variant="info"
          />
        ) : null}
        {stateQuery.isError ? (
          <InlineFeedback
            message="Não foi possível consultar a situação do link. A migration pode ainda não estar aplicada."
            variant="error"
          />
        ) : null}
        {feedback ? (
          <InlineFeedback
            message={feedback.message}
            variant={feedback.variant}
          />
        ) : null}

        {decision ? (
          <View style={[styles.decision, { borderColor: colors.borderSubtle }]}>
            <Text variant="label">{decision.responderName}</Text>
            <Text color="textSecondary" variant="caption">
              Nome autodeclarado, não verificado ·{' '}
              {formatTimestamp(decision.respondedAt)}
            </Text>
            {decision.reason ? <Text>{decision.reason}</Text> : null}
          </View>
        ) : null}

        {ephemeralUrl ? (
          <View style={styles.actions}>
            <Button
              icon={<Icon color="primary" name="copy" size="small" />}
              label="Copiar link"
              onPress={() => {
                void Clipboard.setStringAsync(ephemeralUrl).then(() =>
                  setFeedback({ message: 'Link copiado.', variant: 'success' }),
                );
              }}
              variant="secondary"
            />
            <Button
              icon={<Icon color="textInverse" name="share" size="small" />}
              label="Compartilhar link"
              onPress={() => {
                void Share.share({
                  message: `Orçamento disponível para consulta e resposta: ${ephemeralUrl}`,
                  title: 'Compartilhar orçamento',
                });
              }}
            />
          </View>
        ) : null}

        {!decision && canIssue ? (
          <Button
            disabled={!hostConfigured || stateQuery.isLoading}
            icon={
              <Icon
                color="textInverse"
                name={state?.state === 'active' ? 'refresh' : 'link'}
                size="small"
              />
            }
            label={
              state?.state === 'active'
                ? 'Gerar novo link'
                : quoteStatus === 'draft'
                  ? 'Disponibilizar e gerar link'
                  : 'Gerar link'
            }
            loading={busy}
            onPress={() =>
              setConfirmation(
                state?.state === 'active' ? 'regenerate' : 'issue',
              )
            }
          />
        ) : null}
        {state?.state === 'active' || state?.state === 'responded' ? (
          <Button
            disabled={busy}
            icon={<Icon color="danger" name="unlink" size="small" />}
            label="Revogar acesso"
            onPress={() => setConfirmation('revoke')}
            variant="danger"
          />
        ) : null}
        <Button
          label="Atualizar situação"
          onPress={() => void refresh()}
          variant="ghost"
        />
      </View>

      <ConfirmationDialog
        confirmLabel={
          confirmation === 'revoke' ? 'Revogar acesso' : 'Gerar link'
        }
        description={
          confirmation === 'revoke'
            ? 'O cliente perderá o acesso imediatamente.'
            : confirmation === 'regenerate'
              ? 'O link atual será invalidado e não poderá mais ser usado.'
              : quoteStatus === 'draft'
                ? 'O orçamento será marcado como enviado e esta versão ficará disponível ao cliente.'
                : 'Uma versão imutável deste orçamento ficará disponível por até sete dias.'
        }
        destructive={confirmation === 'revoke' || confirmation === 'regenerate'}
        loading={busy}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          const action = confirmation;
          setConfirmation(null);
          void (action === 'revoke' ? runRevoke() : runIssue());
        }}
        title={
          confirmation === 'revoke'
            ? 'Revogar link do cliente?'
            : confirmation === 'regenerate'
              ? 'Substituir o link atual?'
              : 'Disponibilizar ao cliente?'
        }
        visible={confirmation !== null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  card: {
    borderRadius: radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.md,
  },
  heading: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  icon: {
    alignItems: 'center',
    borderRadius: radii.medium,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: { flex: 1, minWidth: 0 },
  actions: { gap: spacing.sm },
  decision: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
});
