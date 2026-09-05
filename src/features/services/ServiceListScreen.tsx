import { router } from 'expo-router';
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
import { AnimatedPressable } from '@/components/motion';
import {
  ProtectedBottomNavigation,
  ProtectedPageHeader,
} from '@/features/navigation/ProtectedNavigation';
import { radii, sizes, spacing, useTheme } from '@/theme';
import type { Service, ServiceStatusFilter } from './api';
import { formatDuration, formatPriceCents } from './format';
import { useServices } from './hooks';
import { useAuth } from '@/providers/AuthProvider';

const ServiceRow = memo(function ServiceRow({ service }: { service: Service }) {
  const { colors } = useTheme();
  const duration = formatDuration(service.estimated_duration_minutes);
  return (
    <Card
      accessibilityLabel={`${service.name}, ${formatPriceCents(service.price_cents)}${duration ? `, ${duration}` : ''}${service.status === 'inactive' ? ', inativo' : ''}`}
      onPress={() =>
        router.push({
          pathname: '/services/[id]',
          params: { id: service.id },
        })
      }
      variant="interactive"
    >
      <View style={styles.serviceRow}>
        <View
          style={[
            styles.serviceIcon,
            { backgroundColor: colors.primarySubtle },
          ]}
        >
          <Icon color="primary" name="service" size="large" />
        </View>
        <View style={styles.serviceCopy}>
          <View style={styles.serviceHeading}>
            <Text
              numberOfLines={1}
              style={styles.serviceName}
              variant="cardTitle"
            >
              {service.name}
            </Text>
            {service.status === 'active' ? null : (
              <Badge label="Inativo" variant="neutral" />
            )}
          </View>
          {service.description ? (
            <Text color="textSecondary" numberOfLines={2} variant="bodySmall">
              {service.description}
            </Text>
          ) : null}
          <View style={styles.serviceMeta}>
            {duration ? (
              <View style={styles.duration}>
                <Icon color="textMuted" name="duration" size="small" />
                <Text color="textSecondary" variant="caption">
                  {duration}
                </Text>
              </View>
            ) : null}
            <Text
              color="primary"
              numberOfLines={1}
              style={styles.price}
              variant="monetaryValue"
            >
              {formatPriceCents(service.price_cents)}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
});

export function ServiceListScreen({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
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
  const renderService = useCallback(
    ({ item }: { item: Service }) => <ServiceRow service={item} />,
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
            label="Cadastrar serviço"
            onPress={() => router.push('/services/new')}
          />
        )
      }
      description={
        search || status !== 'all'
          ? 'Revise a busca ou altere o filtro.'
          : 'Seus serviços aparecerão aqui conforme você cadastrá-los.'
      }
      icon="service"
      title={
        search || status !== 'all'
          ? 'Nenhum serviço encontrado'
          : 'Nenhum serviço cadastrado'
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
                title="Serviços"
              />
            </View>
            <AnimatedPressable
              accessibilityHint="Abre o formulário para adicionar um serviço."
              accessibilityLabel="Novo serviço"
              accessibilityRole="button"
              haptic="selection"
              onPress={() => router.push('/services/new')}
              style={[
                styles.createButton,
                { backgroundColor: colors.textInverse },
              ]}
            >
              <Icon name="add" rawColor={colors.primary} size="small" />
              <Text color="primary" numberOfLines={1} variant="badge">
                Novo serviço
              </Text>
            </AnimatedPressable>
          </View>
          <Text style={{ color: colors.textInverse }} variant="bodySmall">
            {query.isSuccess
              ? `${totalCount} ${totalCount === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}`
              : 'Organize o que seu negócio oferece'}
          </Text>
        </View>
        <SearchInput
          label="Buscar serviços"
          labelColor="textInverse"
          onChangeText={setInput}
          placeholder="Nome ou descrição"
          reserveMessageSpace={false}
          value={input}
        />
      </View>
      <View style={[styles.body, { backgroundColor: colors.background }]}>
        <View style={styles.filters}>
          <SegmentedControl
            label="Filtrar serviços"
            onChange={setStatus}
            options={[
              { label: 'Todos', value: 'all' },
              { label: 'Ativos', value: 'active' },
              { label: 'Inativos', value: 'inactive' },
            ]}
            value={status}
          />
        </View>
        {query.isLoading ? (
          <View style={styles.content}>
            <View
              accessible
              accessibilityLabel="Carregando serviços"
              accessibilityLiveRegion="polite"
              style={styles.loading}
            >
              <Skeleton height={72} />
              <Skeleton height={72} />
              <Skeleton height={72} />
            </View>
          </View>
        ) : query.isError ? (
          <View style={styles.content}>
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
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={listEmpty}
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <ActivityIndicator
                  accessibilityLabel="Carregando mais serviços"
                  color={colors.primary}
                  style={styles.footer}
                />
              ) : null
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.35}
            renderItem={renderService}
            style={styles.list}
          />
        )}
      </View>
      <ProtectedBottomNavigation selected="services" />
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
  list: { flex: 1 },
  content: {
    alignSelf: 'center',
    flex: 1,
    gap: spacing.md,
    maxWidth: sizes.contentMaxWidth,
    padding: spacing.md,
    width: '100%',
  },
  listContent: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: sizes.contentMaxWidth,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: 112,
    paddingTop: spacing.md,
    width: '100%',
  },
  loading: { gap: spacing.sm },
  serviceRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  serviceIcon: {
    alignItems: 'center',
    borderRadius: radii.control,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  serviceCopy: { flex: 1, gap: spacing.sm, minWidth: 0 },
  serviceHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  serviceName: { flex: 1, minWidth: 0 },
  serviceMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  duration: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  price: { flexShrink: 0, marginLeft: 'auto' },
  footer: { padding: spacing.lg },
});
