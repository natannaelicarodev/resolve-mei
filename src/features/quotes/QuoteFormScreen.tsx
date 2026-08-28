import { zodResolver } from '@hookform/resolvers/zod';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useNavigation } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import {
  Button,
  ConfirmationDialog,
  InlineFeedback,
  Input,
  Screen,
  Text,
} from '@/components/ui';
import { listClients } from '@/features/clients/api';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { listServices } from '@/features/services/api';
import { normalizeError } from '@/lib/errors';
import { spacing, useTheme } from '@/theme';
import { quotesQueryKey } from './hooks';
import { calculateQuoteTotals, centsToMoneyInput } from './domain';
import { saveQuote } from './api';
import type { QuoteWithItems } from './api';
import { defaultQuoteValues, quoteSchema } from './schemas';
import type { QuoteFormData } from './schemas';
import { formatDateForDisplay, maskDateInput } from './date';

function quoteToForm(quote: QuoteWithItems): QuoteFormData {
  return {
    clientId: quote.client_id,
    validUntil: formatDateForDisplay(quote.valid_until),
    discountCents: quote.discount_cents,
    notes: quote.notes ?? '',
    items: quote.items.map((item) => ({
      serviceId: item.service_id,
      name: item.name_snapshot,
      description: item.description_snapshot ?? '',
      quantity: item.quantity,
      unitPriceCents: item.unit_price_cents,
    })),
  };
}

export function QuoteFormScreen({
  userId,
  businessId,
  quote,
}: {
  userId: string;
  businessId: string;
  quote?: QuoteWithItems;
}) {
  return (
    <QuoteForm
      key={`${userId}:${businessId}:${quote?.id ?? 'new'}`}
      businessId={businessId}
      quote={quote}
      userId={userId}
    />
  );
}

function QuoteForm({
  userId,
  businessId,
  quote,
}: {
  userId: string;
  businessId: string;
  quote?: QuoteWithItems;
}) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const mounted = useRef(true);
  const locked = useRef(false);
  const allowNavigation = useRef(false);
  const [pendingExit, setPendingExit] = useState<(() => void) | null>(null);
  const [choosingClient, setChoosingClient] = useState(false);
  const [choosingItem, setChoosingItem] = useState(false);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const clients = useQuery({
    queryKey: ['private', userId, 'quote-form', businessId, 'clients'],
    queryFn: async ({ signal }) => {
      const rows = await listClients(businessId, '', 'active', 0, signal);
      if (rows.some((client) => client.business_id !== businessId))
        throw new Error('CLIENT_IDENTITY_MISMATCH');
      return rows;
    },
    enabled: Boolean(userId && businessId),
  });
  const services = useQuery({
    queryKey: ['private', userId, 'quote-form', businessId, 'services'],
    queryFn: async ({ signal }) => {
      const page = await listServices(businessId, '', 'active', null, signal);
      if (page.items.some((service) => service.business_id !== businessId))
        throw new Error('SERVICE_IDENTITY_MISMATCH');
      return page;
    },
    enabled: Boolean(userId && businessId),
  });
  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: quote ? quoteToForm(quote) : defaultQuoteValues(),
  });
  const fields = useFieldArray({ control: form.control, name: 'items' });
  const items = useWatch({ control: form.control, name: 'items' }) ?? [];
  const selectedClientId = useWatch({
    control: form.control,
    name: 'clientId',
  });
  const discount =
    useWatch({ control: form.control, name: 'discountCents' }) ?? 0;
  const totals = calculateQuoteTotals(items, discount);
  const selectedClient = (clients.data ?? []).find(
    (client) => client.id === selectedClientId,
  );
  useEffect(() => {
    const removeListener = navigation.addListener('beforeRemove', (event) => {
      if (!form.formState.isDirty || allowNavigation.current) return;
      event.preventDefault();
      setPendingExit(() => () => {
        allowNavigation.current = true;
        navigation.dispatch(event.data.action);
      });
    });
    return removeListener;
  }, [form.formState.isDirty, navigation]);
  const mutation = useMutation({
    mutationFn: ({
      data,
      status,
      expectedUserId,
      expectedBusinessId,
      expectedQuoteId,
      identity: expectedIdentity,
    }: {
      data: QuoteFormData;
      status: 'draft' | 'sent';
      expectedUserId: string;
      expectedBusinessId: string;
      expectedQuoteId: string | null;
      identity: string;
    }) => {
      if (
        !mounted.current ||
        expectedUserId !== userId ||
        expectedBusinessId !== businessId ||
        expectedQuoteId !== (quote?.id ?? null) ||
        expectedIdentity !== `${userId}:${businessId}:${quote?.id ?? 'new'}`
      )
        throw new Error('QUOTE_SESSION_CHANGED');
      return saveQuote(businessId, data, status, quote?.id);
    },
    onSuccess: (saved, variables) => {
      if (
        !mounted.current ||
        saved.business_id !== variables.expectedBusinessId ||
        variables.expectedUserId !== userId
      )
        return;
      void queryClient.invalidateQueries({
        queryKey: quotesQueryKey(userId, businessId),
      });
      allowNavigation.current = true;
      router.replace({
        pathname: '/quotes/[id]',
        params: { id: saved.id },
      } as unknown as Href);
    },
    onError: (error) => {
      locked.current = false;
      if (mounted.current)
        form.setError('root', { message: normalizeError(error).message });
    },
  });
  const submit = (status: 'draft' | 'sent') =>
    form.handleSubmit((data) => {
      if (locked.current || !mounted.current) return;
      locked.current = true;
      form.clearErrors('root');
      mutation.mutate({
        data,
        status,
        expectedUserId: userId,
        expectedBusinessId: businessId,
        expectedQuoteId: quote?.id ?? null,
        identity: `${userId}:${businessId}:${quote?.id ?? 'new'}`,
      });
    })();

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      keyboardAvoiding
      safeAreaEdges={['top', 'bottom']}
    >
      <ProtectedPageHeader
        back
        backFallback={'/quotes' as Href}
        title={quote ? 'Editar orçamento' : 'Novo orçamento'}
      />
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          CLIENTE
        </Text>
        {clients.isLoading ? (
          <Text color="textSecondary">Carregando clientes...</Text>
        ) : null}
        {selectedClient && !choosingClient ? (
          <View
            style={[
              styles.clientCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text color="textOnPrimary" variant="label">
                {selectedClient.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.clientInfo}>
              <Text numberOfLines={1} variant="label">
                {selectedClient.name}
              </Text>
              <Text color="textMuted" numberOfLines={1} variant="caption">
                {selectedClient.phone ||
                  selectedClient.email ||
                  'Sem contato informado'}
              </Text>
            </View>
            <AnimatedPressable
              accessibilityLabel="Trocar cliente"
              accessibilityRole="button"
              onPress={() => setChoosingClient(true)}
            >
              <Text color="primary" variant="label">
                Trocar
              </Text>
            </AnimatedPressable>
          </View>
        ) : (
          <View style={styles.choices}>
            {(clients.data ?? []).map((client) => (
              <Button
                key={client.id}
                label={client.name}
                onPress={() => {
                  form.setValue('clientId', client.id, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setChoosingClient(false);
                }}
                variant="secondary"
              />
            ))}
          </View>
        )}
        {form.formState.errors.clientId ? (
          <InlineFeedback
            message={form.formState.errors.clientId.message ?? ''}
            variant="error"
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          ITENS DO ORÇAMENTO
        </Text>
        {fields.fields.map((field, index) => (
          <View
            key={field.id}
            style={[
              styles.itemCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.itemInfo}>
              <Text numberOfLines={1} variant="label">
                {items[index]?.name}
              </Text>
              <Text color="textMuted" variant="caption">
                {items[index]?.quantity}{' '}
                {items[index]?.quantity === 1 ? 'unidade' : 'unidades'}
              </Text>
            </View>
            <Text variant="label">
              {centsToMoneyInput(
                (items[index]?.unitPriceCents ?? 0) *
                  (items[index]?.quantity ?? 0),
              )}
            </Text>
            <AnimatedPressable
              accessibilityLabel={`Remover ${items[index]?.name || `item ${index + 1}`}`}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => fields.remove(index)}
            >
              <MaterialCommunityIcons
                color={colors.textMuted}
                name="close"
                size={18}
              />
            </AnimatedPressable>
          </View>
        ))}
        {choosingItem ? (
          <View style={styles.choices}>
            {(services.data?.items ?? []).map((service) => (
              <Button
                key={service.id}
                label={service.name}
                onPress={() => {
                  const existingIndex = items.findIndex(
                    (item) => item.serviceId === service.id,
                  );
                  const existing = items[existingIndex];
                  if (existingIndex >= 0 && existing)
                    fields.update(existingIndex, {
                      description: existing.description,
                      name: existing.name,
                      quantity: existing.quantity + 1,
                      serviceId: existing.serviceId,
                      unitPriceCents: existing.unitPriceCents,
                    });
                  else
                    fields.append({
                      serviceId: service.id,
                      name: service.name,
                      description: service.description ?? '',
                      quantity: 1,
                      unitPriceCents: service.price_cents,
                    });
                  setChoosingItem(false);
                }}
                variant="secondary"
              />
            ))}
          </View>
        ) : null}
        <AnimatedPressable
          accessibilityLabel="Adicionar item"
          accessibilityRole="button"
          onPress={() => setChoosingItem((current) => !current)}
          style={[styles.addItem, { borderColor: colors.borderStrong }]}
        >
          <MaterialCommunityIcons
            color={colors.primary}
            name="plus"
            size={18}
          />
          <Text color="primary" variant="label">
            Adicionar item
          </Text>
        </AnimatedPressable>
        {form.formState.errors.items?.root?.message ? (
          <InlineFeedback
            message={form.formState.errors.items.root.message}
            variant="error"
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          VALIDADE E OBSERVAÇÕES
        </Text>
        <Controller
          control={form.control}
          name="validUntil"
          render={({ field, fieldState }) => (
            <Input
              accessibilityHint="Digite dia, mês e ano usando somente números."
              keyboardType="number-pad"
              label="Validade"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              reserveMessageSpace={Boolean(fieldState.error)}
              value={field.value}
              onChangeText={(value) => field.onChange(maskDateInput(value))}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="notes"
          render={({ field }) => (
            <Input
              label="Observações"
              maxLength={500}
              placeholder="Condições de pagamento, prazos etc."
              reserveMessageSpace
              value={field.value}
              onChangeText={field.onChange}
              multiline
              showCounter
            />
          )}
        />
      </View>

      <View style={[styles.totalCard, { backgroundColor: colors.surface }]}>
        <Text color="primary" variant="label">
          Total do orçamento
        </Text>
        <Text style={styles.totalValue} variant="cardTitle">
          {centsToMoneyInput(totals.totalCents)}
        </Text>
      </View>
      {form.formState.errors.root?.message ? (
        <InlineFeedback
          message={form.formState.errors.root.message}
          variant="error"
        />
      ) : null}
      <Button
        disabled={mutation.isPending}
        loading={mutation.isPending}
        label="Salvar orçamento"
        onPress={() => void submit('draft')}
      />
      <ConfirmationDialog
        cancelLabel="Continuar editando"
        confirmLabel="Descartar alterações"
        description="As alterações feitas neste orçamento não foram salvas."
        destructive
        onCancel={() => setPendingExit(null)}
        onConfirm={() => {
          const exit = pendingExit;
          setPendingExit(null);
          exit?.();
        }}
        title="Descartar alterações?"
        visible={pendingExit !== null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 10, lineHeight: 14 },
  choices: { gap: spacing.sm },
  clientCard: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  clientInfo: { flex: 1, minWidth: 0 },
  itemCard: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  itemInfo: { flex: 1, minWidth: 0 },
  addItem: {
    alignItems: 'center',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 48,
  },
  totalCard: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: spacing.md,
  },
  totalValue: { fontSize: 22, lineHeight: 28 },
});
