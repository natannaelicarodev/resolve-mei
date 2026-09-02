import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  Card,
  ConfirmationDialog,
  Icon,
  InlineFeedback,
  InlineLoading,
  Input,
  Text,
} from '@/components/ui';
import { formatMoney, formatQuoteNumber } from './domain';
import { formatDateForDisplay } from './date';
import {
  getPublicQuoteErrorCode,
  resolvePublicQuote,
  respondPublicQuote,
} from './publicLink';
import type { PublicQuoteResult } from './publicLink';
import { radii, sizes, spacing, useTheme } from '@/theme';

type Decision = 'approved' | 'rejected';

function readFragmentToken() {
  if (typeof location === 'undefined') return '';
  const token = new URLSearchParams(location.hash.replace(/^#/, '')).get(
    'token',
  );
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : '';
}

export function PublicQuoteScreen() {
  const { colors } = useTheme();
  const [token] = useState(readFragmentToken);
  const [result, setResult] = useState<PublicQuoteResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [errorCode, setErrorCode] = useState('PUBLIC-NETWORK');
  const [decision, setDecision] = useState<Decision>('approved');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [confirmedTerms, setConfirmedTerms] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setNetworkError(false);
    try {
      setResult(
        token ? await resolvePublicQuote(token) : { state: 'unavailable' },
      );
    } catch (error) {
      setErrorCode(getPublicQuoteErrorCode(error));
      setNetworkError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (typeof document !== 'undefined') {
      document.title = 'Orçamento · ResolveMEI';
      const ensureMeta = (name: string, content: string) => {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('name', name);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content);
      };
      ensureMeta('robots', 'noindex,nofollow,noarchive');
      ensureMeta('referrer', 'no-referrer');
    }
    const request = token
      ? resolvePublicQuote(token)
      : Promise.resolve<PublicQuoteResult>({ state: 'unavailable' });
    void request
      .then((next) => {
        if (active) setResult(next);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorCode(getPublicQuoteErrorCode(error));
          setNetworkError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // The fragment token is intentionally captured once and never enters a URL query or cache key.
  }, [token]);

  const submit = async () => {
    const normalizedName = name.trim().replace(/\s+/g, ' ');
    if (normalizedName.length < 2 || normalizedName.length > 120) {
      setFormError('Informe seu nome com 2 a 120 caracteres.');
      return;
    }
    if (decision === 'approved' && !confirmedTerms) {
      setFormError('Confirme os valores e as condições antes de aprovar.');
      return;
    }
    if (reason.length > 1000) {
      setFormError('A justificativa deve ter no máximo 1000 caracteres.');
      return;
    }
    setFormError(null);
    setSending(true);
    try {
      const response = await respondPublicQuote({
        decision,
        name: normalizedName,
        reason,
        token,
      });
      if (response.state === 'unavailable') {
        setResult({ state: 'unavailable' });
      } else {
        await load();
      }
    } catch {
      // A timeout may happen after commit. Resolve first so a retry cannot create an incoherent decision.
      try {
        await load();
        setFormError('A conexão falhou. A situação foi consultada novamente.');
      } catch {
        setNetworkError(true);
      }
    } finally {
      setSending(false);
      setConfirming(false);
    }
  };

  const quote = result?.quote;
  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
            <Icon color="textInverse" name="quote" size="medium" />
          </View>
          <View>
            <Text variant="sectionTitle">ResolveMEI</Text>
            <Text color="textSecondary" variant="caption">
              Orçamento para consulta e resposta
            </Text>
          </View>
        </View>

        {loading ? <InlineLoading label="Carregando orçamento" /> : null}
        {networkError ? (
          <View style={styles.state}>
            <InlineFeedback
              message={`Não foi possível consultar agora. Código: ${errorCode}.`}
              variant="error"
            />
            <Button label="Tentar novamente" onPress={() => void load()} />
          </View>
        ) : null}
        {!loading && !networkError && result?.state === 'unavailable' ? (
          <InlineFeedback
            message="Este link não está disponível. Ele pode ter expirado, sido revogado ou substituído."
            variant="warning"
          />
        ) : null}

        {quote ? (
          <>
            <Card style={styles.hero}>
              <Text color="primary" variant="caption">
                ORÇAMENTO #{formatQuoteNumber(quote.quoteNumber)} · VERSÃO{' '}
                {quote.version}
              </Text>
              <Text variant="sectionTitle">{quote.provider.businessName}</Text>
              <Text color="textSecondary">Para {quote.client.name}</Text>
              <View style={styles.dates}>
                <Text variant="caption">
                  Emissão {formatDateForDisplay(quote.issuedOn)}
                </Text>
                <Text variant="caption">
                  Validade {formatDateForDisplay(quote.validUntil)}
                </Text>
              </View>
            </Card>

            <View style={styles.section}>
              <Text variant="cardTitle">Itens</Text>
              {quote.items.map((item, index) => (
                <View
                  key={`${item.name}-${index}`}
                  style={[
                    styles.item,
                    { borderBottomColor: colors.borderSubtle },
                  ]}
                >
                  <View style={styles.copy}>
                    <Text variant="label">{item.name}</Text>
                    {item.description ? (
                      <Text color="textSecondary" variant="caption">
                        {item.description}
                      </Text>
                    ) : null}
                    <Text color="textSecondary" variant="caption">
                      {item.quantity} × {formatMoney(item.unitPriceCents)}
                    </Text>
                  </View>
                  <Text variant="label">{formatMoney(item.totalCents)}</Text>
                </View>
              ))}
            </View>

            <Card style={styles.summary}>
              <View style={styles.row}>
                <Text color="textSecondary">Subtotal</Text>
                <Text>{formatMoney(quote.subtotalCents)}</Text>
              </View>
              {quote.discountCents ? (
                <View style={styles.row}>
                  <Text color="textSecondary">Desconto</Text>
                  <Text>- {formatMoney(quote.discountCents)}</Text>
                </View>
              ) : null}
              <View
                style={[styles.total, { borderTopColor: colors.borderSubtle }]}
              >
                <Text variant="label">Total</Text>
                <Text color="primary" variant="sectionTitle">
                  {formatMoney(quote.totalCents)}
                </Text>
              </View>
            </Card>

            {result.state === 'responded' && result.decision ? (
              <View style={styles.state}>
                <InlineFeedback
                  message={
                    result.decision.value === 'approved'
                      ? 'A aprovação deste orçamento já foi registrada.'
                      : 'A recusa deste orçamento já foi registrada.'
                  }
                  variant={
                    result.decision.value === 'approved' ? 'success' : 'info'
                  }
                />
                <Text color="textSecondary" variant="caption">
                  Resposta em nome de {result.decision.responderName}. O nome
                  informado não foi verificado por autenticação.
                </Text>
              </View>
            ) : (
              <View style={styles.form}>
                <Text variant="cardTitle">Responder orçamento</Text>
                <View style={styles.choiceRow}>
                  {(['approved', 'rejected'] as const).map((value) => (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: decision === value }}
                      key={value}
                      onPress={() => {
                        setDecision(value);
                        setConfirmedTerms(false);
                        setFormError(null);
                      }}
                      style={[
                        styles.choice,
                        {
                          backgroundColor:
                            decision === value
                              ? colors.primarySubtle
                              : colors.surface,
                          borderColor:
                            decision === value
                              ? colors.primary
                              : colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        color={decision === value ? 'primary' : 'textPrimary'}
                        variant="label"
                      >
                        {value === 'approved' ? 'Aprovar' : 'Recusar'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Input
                  label="Seu nome"
                  maxLength={120}
                  onChangeText={setName}
                  value={name}
                />
                {decision === 'rejected' ? (
                  <Input
                    helperText={`${reason.length}/1000 · opcional`}
                    label="Justificativa"
                    maxLength={1000}
                    multiline
                    onChangeText={setReason}
                    value={reason}
                  />
                ) : (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: confirmedTerms }}
                    onPress={() => setConfirmedTerms((value) => !value)}
                    style={styles.checkRow}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: confirmedTerms
                            ? colors.primary
                            : colors.surface,
                          borderColor: confirmedTerms
                            ? colors.primary
                            : colors.borderStrong,
                        },
                      ]}
                    >
                      {confirmedTerms ? (
                        <Icon color="textInverse" name="success" size="small" />
                      ) : null}
                    </View>
                    <Text style={styles.copy}>
                      Confirmo o orçamento #
                      {formatQuoteNumber(quote.quoteNumber)}, versão{' '}
                      {quote.version}, no total de{' '}
                      {formatMoney(quote.totalCents)}.
                    </Text>
                  </Pressable>
                )}
                <Text color="textSecondary" variant="caption">
                  O nome informado não será verificado por autenticação. Esta
                  resposta não é assinatura digital nem comprovante de
                  pagamento.
                </Text>
                {formError ? (
                  <InlineFeedback message={formError} variant="error" />
                ) : null}
                <Button
                  label={
                    decision === 'approved'
                      ? 'Revisar aprovação'
                      : 'Revisar recusa'
                  }
                  loading={sending}
                  onPress={() => {
                    setFormError(null);
                    setConfirming(true);
                  }}
                  variant={decision === 'approved' ? 'primary' : 'danger'}
                />
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
      <ConfirmationDialog
        confirmLabel={
          decision === 'approved' ? 'Aprovar orçamento' : 'Recusar orçamento'
        }
        description={
          quote
            ? `Orçamento #${formatQuoteNumber(quote.quoteNumber)}, versão ${quote.version}, total ${formatMoney(quote.totalCents)}. Esta decisão será final.`
            : 'Esta decisão será final.'
        }
        destructive={decision === 'rejected'}
        loading={sending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void submit()}
        title={
          decision === 'approved' ? 'Confirmar aprovação?' : 'Confirmar recusa?'
        }
        visible={confirming}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    alignSelf: 'center',
    gap: spacing.lg,
    maxWidth: sizes.contentMaxWidth,
    padding: spacing.lg,
    width: '100%',
  },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  brandIcon: {
    alignItems: 'center',
    borderRadius: radii.medium,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  hero: {
    gap: spacing.xs,
  },
  dates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  section: { gap: spacing.sm },
  item: {
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  copy: { flex: 1, minWidth: 0 },
  summary: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  total: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  state: { gap: spacing.md },
  form: { gap: spacing.md },
  choiceRow: { flexDirection: 'row', gap: spacing.sm },
  choice: {
    alignItems: 'center',
    borderRadius: radii.medium,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  checkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: radii.small,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
});
