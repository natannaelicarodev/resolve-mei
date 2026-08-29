import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnimatedPressable,
  FadeInView,
  useReducedMotion,
} from '@/components/motion';
import {
  Button,
  Card,
  InlineFeedback,
  Skeleton,
  StatusLed,
  Text,
} from '@/components/ui';
import { ProtectedBottomNavigation } from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
import {
  getThemeShadows,
  motion,
  radii,
  sizes,
  spacing,
  useTheme,
} from '@/theme';
import type { Service, ServiceStatusFilter } from './api';
import { formatDuration, formatPriceCents } from './format';
import { useServices } from './hooks';

const FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
] as const;

function serviceSummary(service: Service) {
  const description = service.description?.trim();
  const duration = formatDuration(service.estimated_duration_minutes)
    ?.replace(' h', 'h')
    .replace(' min', 'min');
  if (description && duration) return `${description} · aprox. ${duration}`;
  if (description) return description;
  if (duration) return `Aprox. ${duration}`;
  return 'Sem descrição';
}

function ServiceRow({ service, index }: { service: Service; index: number }) {
  const { colors } = useTheme();
  const active = service.status === 'active';
  return (
    <FadeInView delay={Math.min(index, 8) * motion.stagger}>
      <AnimatedPressable
        accessibilityHint="Abre os detalhes do serviço."
        accessibilityLabel={`${service.name}, ${formatPriceCents(service.price_cents)}, ${serviceSummary(service)}, ${active ? 'ativo' : 'inativo'}`}
        accessibilityRole="button"
        onPress={() =>
          router.push({
            pathname: '/services/[id]',
            params: { id: service.id },
          })
        }
        style={[
          styles.serviceRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        testID="service-list-row"
      >
        <View style={styles.rowCopy}>
          <Text numberOfLines={1} style={styles.serviceName} variant="label">
            {service.name}
          </Text>
          <Text
            color="textMuted"
            numberOfLines={1}
            style={styles.summary}
            variant="caption"
          >
            {serviceSummary(service)}
          </Text>
        </View>
        <View style={styles.rowAside}>
          <Text numberOfLines={1} style={styles.price} variant="label">
            {formatPriceCents(service.price_cents)}
          </Text>
          <StatusLed active={active} />
        </View>
        <MaterialCommunityIcons
          color={colors.textMuted}
          name="chevron-right"
          size={20}
        />
      </AnimatedPressable>
    </FadeInView>
  );
}

function ServiceRowSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.serviceRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.rowCopy}>
        <Skeleton height={12} width="60%" />
        <Skeleton height={10} width="40%" />
      </View>
      <View style={styles.rowAside}>
        <Skeleton height={12} width={48} />
        <Skeleton height={16} radius={radii.pill} width={54} />
      </View>
    </View>
  );
}

function ServiceFilters({
  value,
  onChange,
}: {
  value: ServiceStatusFilter;
  onChange: (status: ServiceStatusFilter) => void;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const activeIndex = FILTERS.findIndex((filter) => filter.value === value);
  const [position] = useState(() => new Animated.Value(activeIndex));
  useEffect(() => {
    if (reducedMotion) {
      position.setValue(activeIndex);
      return;
    }
    const animation = Animated.spring(position, {
      toValue: activeIndex,
      useNativeDriver: false,
      ...motion.spring,
    });
    animation.start();
    return () => animation.stop();
  }, [activeIndex, position, reducedMotion]);
  return (
    <View
      accessibilityLabel="Filtrar serviços"
      accessibilityRole="radiogroup"
      style={[
        styles.filters,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Animated.View
        importantForAccessibility="no"
        pointerEvents="none"
        style={[
          styles.filterThumb,
          {
            backgroundColor: colors.primary,
            left: position.interpolate({
              inputRange: FILTERS.map((_, filterIndex) => filterIndex),
              outputRange: FILTERS.map(
                (_, filterIndex) => `${(filterIndex * 100) / FILTERS.length}%`,
              ),
            }),
            width: `${100 / FILTERS.length}%`,
          },
        ]}
      />
      {FILTERS.map((filter) => {
        const selected = value === filter.value;
        return (
          <AnimatedPressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            containerStyle={styles.filterSlot}
            key={filter.value}
            onPress={() => onChange(filter.value)}
            style={styles.filter}
          >
            <Text
              color={selected ? 'textOnPrimary' : 'textSecondary'}
              style={styles.filterText}
              variant="status"
            >
              {filter.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

export function ServiceListScreen({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const { colors, resolvedTheme } = useTheme();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ServiceStatusFilter>('all');
  const query = useServices(user?.id ?? '', businessId, search, status);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);
  const services = useMemo(() => {
    const unique = new Map<string, Service>();
    for (const page of query.data?.pages ?? [])
      for (const service of page.items) unique.set(service.id, service);
    return [...unique.values()];
  }, [query.data?.pages]);
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;
  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage)
      void query.fetchNextPage();
  };

  const header = (
    <FadeInView style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <Text style={styles.title} variant="sectionTitle">
            Serviços
          </Text>
          <Text color="textMuted" style={styles.count} variant="caption">
            {query.isSuccess
              ? `${totalCount} encontrados`
              : 'Organize o que seu negócio oferece'}
          </Text>
        </View>
        <AnimatedPressable
          accessibilityHint="Abre o formulário para adicionar um serviço."
          accessibilityLabel="Novo serviço"
          accessibilityRole="button"
          onPress={() => router.push('/services/new')}
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
            Novo serviço
          </Text>
        </AnimatedPressable>
      </View>
      <View
        style={[
          styles.search,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <MaterialCommunityIcons
          color={colors.textMuted}
          name="magnify"
          size={19}
        />
        <TextInput
          accessibilityLabel="Buscar serviços"
          onChangeText={setInput}
          placeholder="Nome ou descrição do serviço"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={[styles.searchInput, { color: colors.textPrimary }]}
          value={input}
        />
      </View>
      <ServiceFilters onChange={setStatus} value={status} />
    </FadeInView>
  );

  const empty = (
    <Card style={styles.empty}>
      <MaterialCommunityIcons
        color={colors.textMuted}
        name="briefcase-search-outline"
        size={40}
      />
      <Text align="center" variant="cardTitle">
        {search || status !== 'all'
          ? 'Nenhum serviço encontrado'
          : 'Nenhum serviço cadastrado'}
      </Text>
      <Text align="center" color="textSecondary">
        {search || status !== 'all'
          ? 'Revise a busca ou altere o filtro.'
          : 'Seus serviços aparecerão aqui conforme você cadastrá-los.'}
      </Text>
      {search || status !== 'all' ? (
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
          label="Cadastrar serviço"
          onPress={() => router.push('/services/new')}
        />
      )}
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
          <View
            accessible
            accessibilityLabel="Carregando serviços"
            accessibilityLiveRegion="polite"
            style={styles.loading}
          >
            {[0, 1, 2].map((skeletonIndex) => (
              <FadeInView
                delay={skeletonIndex * motion.stagger}
                key={skeletonIndex}
              >
                <ServiceRowSkeleton />
              </FadeInView>
            ))}
          </View>
        </View>
      ) : query.isError ? (
        <View style={styles.content}>
          {header}
          <InlineFeedback
            message="Não foi possível carregar os serviços."
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
          data={services}
          keyExtractor={(service) => service.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={empty}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator
                accessibilityLabel="Carregando mais serviços"
                color={colors.primary}
                style={styles.footer}
              />
            ) : null
          }
          ItemSeparatorComponent={ListGap}
          ListHeaderComponent={header}
          onEndReached={loadMore}
          onEndReachedThreshold={0.35}
          renderItem={({ item, index }) => (
            <ServiceRow index={index} service={item} />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.list}
        />
      )}
      <ProtectedBottomNavigation selected="services" />
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
    paddingBottom: spacing.xl,
    paddingHorizontal: 18,
    paddingTop: 16,
    width: '100%',
  },
  header: { gap: 12, marginBottom: 14 },
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
  search: {
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 12, minHeight: 44, paddingVertical: 0 },
  filters: {
    borderRadius: radii.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 3,
    position: 'relative',
  },
  filterThumb: {
    borderRadius: radii.small,
    bottom: 3,
    position: 'absolute',
    top: 3,
  },
  filterSlot: { flex: 1 },
  filter: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  filterText: { fontSize: 11 },
  listGap: { height: 8 },
  loading: { gap: 8 },
  serviceRow: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    minHeight: 64,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowCopy: { flex: 1, gap: 1, minWidth: 0 },
  serviceName: { fontSize: 12, lineHeight: 17 },
  summary: { fontSize: 10, lineHeight: 14 },
  rowAside: { alignItems: 'flex-end', gap: 3 },
  price: { fontSize: 12, lineHeight: 17 },
  empty: { alignItems: 'center', marginTop: 8 },
  footer: { padding: spacing.lg },
});
