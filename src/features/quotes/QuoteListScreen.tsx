import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/components/motion';
import {
  Badge,
  Button,
  CompactCreateButton,
  EmptyState,
  Icon,
  InlineFeedback,
  ListPageHeader,
  SearchInput,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
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

function QuoteRow({
  item,
  divided,
  first,
  last,
}: {
  item: Quote;
  divided: boolean;
  first: boolean;
  last: boolean;
}) {
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
    <AnimatedPressable
      accessibilityLabel={`${formatQuoteNumber(item.quote_number)}, ${item.client_name_snapshot}, ${quoteStatusLabels[display]}, ${timing}, ${formatMoney(item.total_cents)}`}
      accessibilityRole="button"
      haptic="selection"
      onPress={() =>
        router.push({
          pathname: '/quotes/[id]',
          params: { id: item.id },
        } as unknown as Href)
      }
      style={[
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderLeftWidth: StyleSheet.hairlineWidth,
          borderRightWidth: StyleSheet.hairlineWidth,
        },
        first && {
          borderTopLeftRadius: radii.card,
          borderTopRightRadius: radii.card,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        last && {
          borderBottomLeftRadius: radii.card,
          borderBottomRightRadius: radii.card,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
        divided && {
          borderTopColor: colors.borderSubtle,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        urgencyEdge && {
          borderLeftColor: urgencyEdge,
          borderLeftWidth: 3,
          paddingLeft: spacing.md - 3,
        },
      ]}
    >
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
      <Icon color="textMuted" name="forward" size="medium" />
    </AnimatedPressable>
  );
}

export function QuoteListScreen({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const { colors } = useTheme();
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
  const header = (
    <View style={styles.header}>
      <ListPageHeader
        title="Orçamentos"
        summary={
          query.isSuccess
            ? totalCount === 0
              ? 'Nenhum encontrado'
              : `${totalCount} ${totalCount === 1 ? 'encontrado' : 'encontrados'}`
            : 'Consulte e organize seus orçamentos'
        }
        action={
          <CompactCreateButton
            accessibilityHint="Abre o formulário para criar um orçamento."
            label="Novo orçamento"
            icon="quote"
            onPress={() => router.push('/quotes/new')}
          />
        }
      />
      <SearchInput
        label="Buscar orçamentos"
        placeholder="Número ou cliente"
        value={input}
        onChangeText={setInput}
        reserveMessageSpace={false}
      />
      <SegmentedControl
        label="Filtrar orçamentos"
        onChange={setStatus}
        options={STATUS_FILTERS}
        scrollable
        value={status}
      />
    </View>
  );
  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.page, { backgroundColor: colors.background }]}
    >
      {query.isLoading ? (
        <View style={styles.content}>
          {header}
          <Skeleton height={84} />
          <Skeleton height={84} />
        </View>
      ) : query.isError ? (
        <View style={styles.content}>
          {header}
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
          ListHeaderComponent={header}
          onRefresh={() => void query.refetch()}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage)
              void query.fetchNextPage();
          }}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              action={
                <Button
                  label="Criar orçamento"
                  onPress={() => router.push('/quotes/new')}
                />
              }
              description={
                search || status !== 'all'
                  ? 'Tente alterar a busca ou os filtros.'
                  : 'Seus orçamentos aparecerão aqui conforme você criá-los.'
              }
              icon="quote"
              title={
                search || status !== 'all'
                  ? 'Nenhum orçamento encontrado'
                  : 'Você ainda não criou nenhum orçamento.'
              }
            />
          }
          renderItem={({ item: quote, index }) => (
            <QuoteRow
              divided={index > 0}
              first={index === 0}
              item={quote}
              last={index === quotes.length - 1}
            />
          )}
        />
      )}
      <ProtectedBottomNavigation selected="quotes" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    alignSelf: 'center',
    flex: 1,
    gap: spacing.lg,
    maxWidth: sizes.contentMaxWidth,
    padding: spacing.md,
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
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 104,
    padding: spacing.md,
  },
  rowCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  rowTop: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  quoteTitle: { flex: 1, minWidth: 0 },
  quoteValue: { fontSize: 16, lineHeight: 22, minWidth: 0 },
});
