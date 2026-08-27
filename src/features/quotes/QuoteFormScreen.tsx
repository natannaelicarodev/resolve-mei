import { zodResolver } from '@hookform/resolvers/zod';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useNavigation } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
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
import {
  calculateQuoteTotals,
  centsToMoneyInput,
  moneyInputToCents,
} from './domain';
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
    <Screen keyboardAvoiding safeAreaEdges={['top', 'bottom']}>
      <ProtectedPageHeader
        back
        backFallback={'/quotes' as Href}
        title={quote ? 'Editar orçamento' : 'Novo orçamento'}
      />
      <Card>
        <Text variant="cardTitle">Cliente</Text>
        {clients.isLoading ? (
          <Text color="textSecondary">Carregando clientes...</Text>
        ) : null}
        {(clients.data ?? []).map((client) => (
          <Button
            key={client.id}
            label={client.name}
            onPress={() =>
              form.setValue('clientId', client.id, { shouldValidate: true })
            }
            state={selectedClientId === client.id ? 'success' : 'normal'}
            variant="secondary"
          />
        ))}
        {form.formState.errors.clientId ? (
          <InlineFeedback
            message={form.formState.errors.clientId.message ?? ''}
            variant="error"
          />
        ) : null}
      </Card>
      <Card>
        <Text variant="cardTitle">Itens</Text>
        {(services.data?.items ?? []).map((service) => (
          <Button
            key={service.id}
            label={`Adicionar ${service.name}`}
            onPress={() =>
              fields.append({
                serviceId: service.id,
                name: service.name,
                description: service.description ?? '',
                quantity: 1,
                unitPriceCents: service.price_cents,
              })
            }
            variant="secondary"
          />
        ))}
        <Button
          icon={
            <MaterialCommunityIcons
              color={colors.primary}
              name="plus"
              size={20}
            />
          }
          label="Adicionar item personalizado"
          onPress={() =>
            fields.append({
              serviceId: null,
              name: '',
              description: '',
              quantity: 1,
              unitPriceCents: 0,
            })
          }
          variant="secondary"
        />
        {fields.fields.map((field, index) => (
          <View key={field.id} style={styles.item}>
            <Controller
              control={form.control}
              name={`items.${index}.name`}
              render={({ field: itemField, fieldState }) => (
                <Input
                  label={`Nome do item ${index + 1}`}
                  value={itemField.value}
                  onChangeText={itemField.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name={`items.${index}.description`}
              render={({ field: itemField }) => (
                <Input
                  label="Descrição complementar"
                  value={itemField.value}
                  onChangeText={itemField.onChange}
                />
              )}
            />
            <Controller
              control={form.control}
              name={`items.${index}.quantity`}
              render={({ field: itemField, fieldState }) => (
                <Input
                  label="Quantidade"
                  keyboardType="number-pad"
                  value={String(itemField.value)}
                  onChangeText={(value) =>
                    itemField.onChange(Number(value.replace(/\D/g, '')))
                  }
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name={`items.${index}.unitPriceCents`}
              render={({ field: itemField }) => (
                <Input
                  label="Valor unitário"
                  keyboardType="number-pad"
                  value={centsToMoneyInput(itemField.value)}
                  onChangeText={(value) =>
                    itemField.onChange(moneyInputToCents(value))
                  }
                />
              )}
            />
            <Button
              label="Remover item"
              onPress={() => fields.remove(index)}
              variant="ghost"
            />
          </View>
        ))}
        {form.formState.errors.items?.root?.message ? (
          <InlineFeedback
            message={form.formState.errors.items.root.message}
            variant="error"
          />
        ) : null}
      </Card>
      <Card>
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
              value={field.value}
              onChangeText={(value) => field.onChange(maskDateInput(value))}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="discountCents"
          render={({ field, fieldState }) => (
            <Input
              label="Desconto"
              keyboardType="number-pad"
              value={centsToMoneyInput(field.value)}
              onChangeText={(value) => field.onChange(moneyInputToCents(value))}
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
              value={field.value}
              onChangeText={field.onChange}
              multiline
            />
          )}
        />
        <Text>Subtotal: {centsToMoneyInput(totals.subtotalCents)}</Text>
        <Text variant="cardTitle">
          Total: {centsToMoneyInput(totals.totalCents)}
        </Text>
      </Card>
      {form.formState.errors.root?.message ? (
        <InlineFeedback
          message={form.formState.errors.root.message}
          variant="error"
        />
      ) : null}
      <Button
        disabled={mutation.isPending}
        loading={mutation.isPending}
        label="Salvar como rascunho"
        onPress={() => void submit('draft')}
      />
      <Button
        disabled={mutation.isPending}
        label="Salvar e marcar como enviado"
        onPress={() => void submit('sent')}
        variant="secondary"
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
  item: { gap: spacing.sm, paddingVertical: spacing.sm },
});
