import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '@/components/motion';
import {
  Badge,
  Button,
  Card,
  CompactCreateButton,
  InlineFeedback,
  ListPageHeader,
  SearchInput,
  SegmentedControl,
  Skeleton,
  Text,
} from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
import { sizes, spacing, useTheme } from '@/theme';
import type { Quote, QuoteStatusFilter } from './api';
import {
  formatMoney,
  formatQuoteNumber,
  getDisplayQuoteStatus,
  quoteStatusLabels,
} from './domain';
import { useQuotes } from './hooks';
import { formatDateForDisplay } from './date';

const STATUS_FILTERS: readonly {
  label: string;
  value: QuoteStatusFilter;
}[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Rascunhos', value: 'draft' },
  { label: 'Enviados', value: 'sent' },
  { label: 'Aprovados', value: 'approved' },
];

function QuoteRow({ item, divided }: { item: Quote; divided: boolean }) {
  const { colors } = useTheme();
  const display = getDisplayQuoteStatus(item.status, item.valid_until);
  const issuedOn = formatDateForDisplay(item.issued_on);
  const validUntil = formatDateForDisplay(item.valid_until);
  return (
    <AnimatedPressable
      accessibilityLabel={`${formatQuoteNumber(item.quote_number)}, ${item.client_name_snapshot}, ${quoteStatusLabels[display]}, emissão ${issuedOn}, validade ${validUntil}, ${formatMoney(item.total_cents)}`}
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/quotes/[id]',
          params: { id: item.id },
        } as unknown as Href)
      }
      style={[
        styles.row,
        divided && {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
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
        <Text color="textSecondary" numberOfLines={1} variant="caption">
          {issuedOn} · validade {validUntil}
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
      <MaterialCommunityIcons
        color={colors.textMuted}
        name="chevron-right"
        size={20}
      />
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
            icon="file-document-plus-outline"
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
      edges={['top', 'bottom']}
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
          data={quotes.length ? [quotes] : []}
          keyExtractor={() => 'quote-list'}
          ListHeaderComponent={header}
          onRefresh={() => void query.refetch()}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage)
              void query.fetchNextPage();
          }}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} />
            ) : null
          }
          ListEmptyComponent={
            <Card style={styles.empty}>
              <MaterialCommunityIcons
                color={colors.textMuted}
                name="file-document-outline"
                size={40}
              />
              <Text variant="cardTitle">
                {search || status !== 'all'
                  ? 'Nenhum orçamento encontrado'
                  : 'Você ainda não criou nenhum orçamento.'}
              </Text>
              <Text color="textSecondary">
                {search || status !== 'all'
                  ? 'Tente alterar a busca ou os filtros.'
                  : 'Seus orçamentos aparecerão aqui conforme você criá-los.'}
              </Text>
              <Button
                label="Criar orçamento"
                onPress={() => router.push('/quotes/new')}
              />
            </Card>
          }
          renderItem={({ item: group }) => (
            <Card style={styles.groupedList}>
              {group.map((quote, index) => (
                <QuoteRow divided={index > 0} item={quote} key={quote.id} />
              ))}
            </Card>
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
  groupedList: { gap: 0, overflow: 'hidden', padding: 0 },
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
  empty: { alignItems: 'center', gap: spacing.md },
});
