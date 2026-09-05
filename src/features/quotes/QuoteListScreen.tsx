import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/components/motion';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  InlineFeedback,
  SearchInput,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import {
  ProtectedBottomNavigation,
  ProtectedPageHeader,
} from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
import { radii, sizes, spacing, useTheme } from '@/theme';
import type { Quote, QuoteStatusFilter } from './api';
import {
  formatMoney,
  formatQuoteNumber,
  getDisplayQuoteStatus,
  quoteStatusLabels,
} from './domain';
import { useQuotes } from './hooks';
import { quoteTimingLabel, quoteUrgency } from './urgency';

const STATUS_FILTERS: readonly {
  label: string;
  value: QuoteStatusFilter;
}[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Rascunhos', value: 'draft' },
  { label: 'Enviados', value: 'sent' },
  { label: 'Aprovados', value: 'approved' },
];

const QuoteRow = memo(function QuoteRow({ item }: { item: Quote }) {
  const { colors } = useTheme();
  const display = getDisplayQuoteStatus(item.status, item.valid_until);
  const timing = quoteTimingLabel(display, item.issued_on, item.valid_until);
  // A urgência aparece duas vezes na linha — no texto e na faixa lateral —
  // porque cor sozinha não pode carregar estado.
  const urgency = quoteUrgency(display, item.valid_until);
  const urgencyTone =
    urgency === 'expired'
      ? 'danger'
      : urgency === 'due'
        ? 'warning'
        : 'textSecondary';
  const urgencyEdge =
    urgency === 'expired'
      ? colors.danger
      : urgency === 'due'
        ? colors.warning
        : undefined;
  return (
    <Card
      accessibilityLabel={`${formatQuoteNumber(item.quote_number)}, ${item.client_name_snapshot}, ${quoteStatusLabels[display]}, ${timing}, ${formatMoney(item.total_cents)}`}
      onPress={() =>
        router.push({
          pathname: '/quotes/[id]',
          params: { id: item.id },
        } as unknown as Href)
      }
      style={[
        styles.quoteCard,
        urgencyEdge && {
          borderLeftColor: urgencyEdge,
          borderLeftWidth: 3,
        },
      ]}
      variant="interactive"
    >
      <View style={styles.row}>
        <View
          style={[styles.quoteIcon, { backgroundColor: colors.primarySubtle }]}
        >
          <Icon color="primary" name="quote" size="large" />
        </View>
        <View style={styles.rowCopy}>
          <View style={styles.rowTop}>
            <Text numberOfLines={1} style={styles.quoteTitle} variant="label">
              #{formatQuoteNumber(item.quote_number)} ·{' '}
              {item.client_name_snapshot}
            </Text>
            <Badge
              label={quoteStatusLabels[display]}
              variant={
                display === 'approved'
                  ? 'success'
                  : display === 'rejected' || display === 'canceled'
                    ? 'danger'
                    : 'neutral'
              }
            />
          </View>
          <Text color={urgencyTone} numberOfLines={1} variant="caption">
            {timing}
          </Text>
          <Text
            adjustsFontSizeToFit
            color="primary"
            minimumFontScale={0.78}
            numberOfLines={1}
            style={styles.quoteValue}
          >
            {formatMoney(item.total_cents)}
          </Text>
        </View>
      </View>
    </Card>
  );
});

export function QuoteListScreen({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuoteStatusFilter>('all');
  const query = useQuotes(user?.id ?? '', businessId, search, status);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);
  const quotes = useMemo(() => {
    const unique = new Map<string, Quote>();
    for (const page of query.data?.pages ?? [])
      for (const quote of page.items) unique.set(quote.id, quote);
    return [...unique.values()];
  }, [query.data?.pages]);
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage)
      void query.fetchNextPage();
  };
  const renderQuote = useCallback(
    ({ item }: { item: Quote }) => <QuoteRow item={item} />,
    [],
  );
  const listEmpty = (
    <EmptyState
      action={
        search || status !== 'all' ? (
          <Button
            label="Limpar busca e filtros"
            onPress={() => {
              setInput('');
              setSearch('');
              setStatus('all');
            }}
            variant="ghost"
          />
        ) : (
          <Button
            label="Criar orçamento"
            onPress={() => router.push('/quotes/new')}
          />
        )
      }
      description={
        search || status !== 'all'
          ? 'Revise a busca ou altere o filtro.'
          : 'Seus orçamentos aparecerão aqui conforme você criá-los.'
      }
      icon="quote"
      title={
        search || status !== 'all'
          ? 'Nenhum orçamento encontrado'
          : 'Nenhum orçamento criado'
      }
    />
  );
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.page, { backgroundColor: colors.primary }]}
    >
      <StatusBar style="light" />
      <View
        style={[
          styles.identityBand,
          { backgroundColor: colors.primary, width: windowWidth + 4 },
        ]}
      >
        <View style={styles.bandStage}>
          <View style={styles.titleRow}>
            <View style={styles.headerTitle}>
              <ProtectedPageHeader
                foregroundColor={colors.textInverse}
                title="Orçamentos"
              />
            </View>
            <AnimatedPressable
              accessibilityHint="Abre o formulário para criar um orçamento."
              accessibilityLabel="Novo orçamento"
              accessibilityRole="button"
              haptic="selection"
              onPress={() => router.push('/quotes/new')}
              style={[
                styles.createButton,
                { backgroundColor: colors.textInverse },
              ]}
            >
              <Icon name="add" rawColor={colors.primary} size="small" />
              <Text color="primary" numberOfLines={1} variant="badge">
                Novo orçamento
              </Text>
            </AnimatedPressable>
          </View>
          <Text style={{ color: colors.textInverse }} variant="bodySmall">
            {query.isSuccess
              ? `${totalCount} ${totalCount === 1 ? 'encontrado' : 'encontrados'}`
              : 'Acompanhe propostas e decisões dos clientes'}
          </Text>
        </View>
        <SearchInput
          label="Buscar orçamentos"
          labelColor="textInverse"
          placeholder="Número ou cliente"
          value={input}
          onChangeText={setInput}
          reserveMessageSpace={false}
        />
      </View>
      <View style={[styles.body, { backgroundColor: colors.background }]}>
        <View style={styles.filters}>
          <SegmentedControl
            label="Filtrar orçamentos"
            onChange={setStatus}
            options={STATUS_FILTERS}
            scrollable
            value={status}
          />
        </View>
        {query.isLoading ? (
          <View style={styles.content}>
            <Skeleton height={84} />
            <Skeleton height={84} />
          </View>
        ) : query.isError ? (
          <View style={styles.content}>
            <InlineFeedback
              message="Não foi possível carregar os orçamentos."
              variant="error"
            />
            <Button
              label="Tentar novamente"
              variant="secondary"
              onPress={() => void query.refetch()}
            />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.list}
            data={quotes}
            keyExtractor={(quote) => quote.id}
            showsVerticalScrollIndicator={false}
            onRefresh={() => void query.refetch()}
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onEndReached={loadMore}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator color={colors.primary} />
              ) : null
            }
            ListEmptyComponent={listEmpty}
            renderItem={renderQuote}
          />
        )}
      </View>
      <ProtectedBottomNavigation selected="quotes" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  identityBand: {
    alignSelf: 'center',
    gap: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  bandStage: {
    alignSelf: 'center',
    gap: spacing.xs,
    maxWidth: sizes.contentMaxWidth,
    width: '100%',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  headerTitle: { flex: 1, minWidth: 0 },
  createButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  body: { flex: 1 },
  filters: {
    alignSelf: 'center',
    maxWidth: sizes.contentMaxWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    width: '100%',
  },
  content: {
    alignSelf: 'center',
    flex: 1,
    gap: spacing.lg,
    maxWidth: sizes.contentMaxWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    width: '100%',
  },
  list: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: sizes.contentMaxWidth,
    padding: spacing.md,
    paddingBottom: 112,
    width: '100%',
  },
  quoteCard: { padding: spacing.md },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quoteIcon: {
    alignItems: 'center',
    borderRadius: radii.control,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  rowCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  rowTop: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  quoteTitle: { flex: 1, minWidth: 0 },
  quoteValue: { fontSize: 16, lineHeight: 22, minWidth: 0 },
});
