import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/motion';
import { Button, Card, InlineFeedback, Skeleton, Text } from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
import { getThemeShadows, radii, sizes, spacing, useTheme } from '@/theme';
import type { ColorToken } from '@/theme';
import type { Quote, QuoteStatusFilter } from './api';
import { formatDateForDisplay } from './date';
import {
  formatMoney,
  formatQuoteNumber,
  getDisplayQuoteStatus,
  quoteStatusLabels,
} from './domain';
import type { DisplayQuoteStatus } from './domain';
import { useQuotes } from './hooks';

const STATUS_FILTERS: readonly {
  label: string;
  value: QuoteStatusFilter;
}[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Rascunhos', value: 'draft' },
  { label: 'Enviados', value: 'sent' },
  { label: 'Aprovados', value: 'approved' },
];

const STATUS_COLORS: Record<
  DisplayQuoteStatus,
  { background: ColorToken; foreground: ColorToken }
> = {
  approved: { background: 'successSubtle', foreground: 'success' },
  sent: { background: 'warningSubtle', foreground: 'warning' },
  draft: { background: 'surfacePressed', foreground: 'textMuted' },
  rejected: { background: 'dangerSubtle', foreground: 'danger' },
  canceled: { background: 'dangerSubtle', foreground: 'danger' },
  expired: { background: 'warningSubtle', foreground: 'warning' },
};

function QuoteRow({ item }: { item: Quote }) {
  const { colors } = useTheme();
  const display = getDisplayQuoteStatus(item.status, item.valid_until);
  const statusColors = STATUS_COLORS[display];
  const issuedOn = formatDateForDisplay(item.issued_on);
  const validUntil = formatDateForDisplay(item.valid_until) || '—';
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
        styles.quoteRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      testID="quote-list-row"
    >
      <View style={styles.rowTop}>
        <Text numberOfLines={1} style={styles.quoteTitle} variant="label">
          #{formatQuoteNumber(item.quote_number)} · {item.client_name_snapshot}
        </Text>
        <View
          accessible
          accessibilityLabel={`Status: ${quoteStatusLabels[display]}`}
          style={[
            styles.status,
            { backgroundColor: colors[statusColors.background] },
          ]}
        >
          <Text
            color={statusColors.foreground}
            style={styles.statusText}
            variant="status"
          >
            {quoteStatusLabels[display]}
          </Text>
        </View>
      </View>
      <Text
        color="textMuted"
        numberOfLines={1}
        style={styles.dates}
        variant="caption"
      >
        {issuedOn} · validade {validUntil}
      </Text>
      <View style={styles.valueRow}>
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          numberOfLines={1}
          style={styles.quoteValue}
        >
          {formatMoney(item.total_cents)}
        </Text>
        <MaterialCommunityIcons
          color={colors.textMuted}
          name="chevron-right"
          size={20}
        />
      </View>
    </AnimatedPressable>
  );
}

function QuoteFilters({
  value,
  onChange,
}: {
  value: QuoteStatusFilter;
  onChange: (status: QuoteStatusFilter) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      accessibilityLabel="Filtrar orçamentos"
      contentContainerStyle={styles.filters}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {STATUS_FILTERS.map((filter) => {
        const selected = value === filter.value;
        return (
          <AnimatedPressable
            accessibilityLabel={filter.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, selected }}
            key={filter.value}
            onPress={() => onChange(filter.value)}
            style={[
              styles.filter,
              {
                backgroundColor: selected ? colors.primary : colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              color={selected ? 'textOnPrimary' : 'textSecondary'}
              numberOfLines={1}
              style={styles.filterText}
              variant="status"
            >
              {filter.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

export function QuoteListScreen({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const { colors, resolvedTheme } = useTheme();
  const [status, setStatus] = useState<QuoteStatusFilter>('all');
  const query = useQuotes(user?.id ?? '', businessId, '', status);
  const quotes = useMemo(() => {
    const unique = new Map<string, Quote>();
    for (const page of query.data?.pages ?? [])
      for (const quote of page.items) unique.set(quote.id, quote);
    return [...unique.values()];
  }, [query.data?.pages]);
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text numberOfLines={1} style={styles.title} variant="sectionTitle">
            Orçamentos
          </Text>
          <Text color="textMuted" style={styles.count} variant="caption">
            {query.isSuccess
              ? totalCount === 1
                ? '1 encontrado'
                : `${totalCount} encontrados`
              : 'Consulte e organize seus orçamentos'}
          </Text>
        </View>
        <AnimatedPressable
          accessibilityHint="Abre o formulário para criar um orçamento."
          accessibilityLabel="Novo orçamento"
          accessibilityRole="button"
          onPress={() => router.push('/quotes/new')}
          style={[
            styles.addButton,
            { backgroundColor: colors.primary },
            getThemeShadows(resolvedTheme).floating,
          ]}
        >
          <MaterialCommunityIcons
            color={colors.textOnPrimary}
            name="plus"
            size={18}
          />
          <Text color="textOnPrimary" style={styles.addLabel} variant="status">
            Novo orçamento
          </Text>
        </AnimatedPressable>
      </View>
      <QuoteFilters onChange={setStatus} value={status} />
    </View>
  );

  const empty = (
    <Card style={styles.empty}>
      <MaterialCommunityIcons
        color={colors.textMuted}
        name="file-document-outline"
        size={40}
      />
      <Text align="center" variant="cardTitle">
        {status !== 'all'
          ? 'Nenhum orçamento encontrado'
          : 'Você ainda não criou nenhum orçamento.'}
      </Text>
      <Text align="center" color="textSecondary">
        {status !== 'all'
          ? 'Tente alterar os filtros.'
          : 'Seus orçamentos aparecerão aqui conforme você criá-los.'}
      </Text>
      <Button
        label="Criar orçamento"
        onPress={() => router.push('/quotes/new')}
      />
    </Card>
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
            onPress={() => void query.refetch()}
            variant="secondary"
          />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={quotes}
          keyExtractor={(quote) => quote.id}
          ItemSeparatorComponent={ListGap}
          ListHeaderComponent={header}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage)
              void query.fetchNextPage();
          }}
          onRefresh={() => void query.refetch()}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={styles.footer} />
            ) : null
          }
          ListEmptyComponent={empty}
          renderItem={({ item }) => <QuoteRow item={item} />}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
      <ProtectedBottomNavigation selected="quotes" />
    </SafeAreaView>
  );
}

function ListGap() {
  return <View style={styles.listGap} />;
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  list: { flex: 1 },
  content: {
    alignSelf: 'center',
    flex: 1,
    gap: spacing.md,
    maxWidth: sizes.contentMaxWidth,
    paddingHorizontal: 18,
    paddingTop: 16,
    width: '100%',
  },
  listContent: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: sizes.contentMaxWidth,
    paddingBottom: 32,
    paddingHorizontal: 18,
    paddingTop: 16,
    width: '100%',
  },
  header: { gap: 14, marginBottom: 14 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  titleCopy: { flex: 1, gap: 2, minWidth: 0 },
  title: { fontSize: 22, lineHeight: 28 },
  count: { fontSize: 12, lineHeight: 18 },
  addButton: {
    alignItems: 'center',
    borderRadius: 13,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  addLabel: { fontSize: 11 },
  filters: { gap: 8, paddingRight: 18 },
  filter: {
    alignItems: 'center',
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 15,
  },
  filterText: { fontSize: 11 },
  listGap: { height: 8 },
  quoteRow: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
    minHeight: 84,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  rowTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  quoteTitle: { flex: 1, fontSize: 12, lineHeight: 17, minWidth: 0 },
  status: {
    borderRadius: radii.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: { fontSize: 9, lineHeight: 12 },
  dates: { fontSize: 10, lineHeight: 14 },
  valueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quoteValue: { flex: 1, fontSize: 16, lineHeight: 22, minWidth: 0 },
  empty: { alignItems: 'center', gap: spacing.md, marginTop: 8 },
  footer: { padding: spacing.lg },
});
