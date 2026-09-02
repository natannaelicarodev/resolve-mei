import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  ConfirmationDialog,
  DateInput,
  Dialog,
  InlineFeedback,
  Input,
  MoneyInput,
  Screen,
  Select,
  Switch,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { formatQuoteNumber } from '@/features/quotes/domain';
import {
  formatDateForDisplay,
  getTodayDatabaseDate,
  maskDateInput,
  parseDateForDatabase,
} from '@/features/quotes/date';
import {
  maskBigIntMoneyInput,
  moneyInputToCentsText,
} from '@/features/receivables/domain';
import { spacing } from '@/theme';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { ExpenseReceiptSection } from './ExpenseReceiptSection';
import {
  expenseCategories,
  expenseCategoryLabels,
  expenseErrorMessage,
  type ExpenseCategory,
} from './domain';
import {
  useExpense,
  useExpenseMutations,
  useExpenseQuoteOptions,
} from './hooks';

export function ExpenseFormScreen({
  userId,
  businessId,
  expenseId,
  duplicateExpenseId,
}: {
  userId: string;
  businessId: string;
  expenseId?: string;
  duplicateExpenseId?: string;
}) {
  const existing = useExpense(
    userId,
    businessId,
    expenseId ?? duplicateExpenseId ?? '',
  );
  const quotes = useExpenseQuoteOptions(userId, businessId);
  const mutations = useExpenseMutations(userId, businessId);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(
    formatDateForDisplay(getTodayDatabaseDate()),
  );
  const [category, setCategory] = useState<ExpenseCategory>('material');
  const [description, setDescription] = useState('');
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [recurring, setRecurring] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [loadedExpenseId, setLoadedExpenseId] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const discard = useUnsavedChangesGuard(dirty);
  const value = existing.data;
  if (value && loadedExpenseId !== value.id) {
    setLoadedExpenseId(value.id);
    setAmount(maskBigIntMoneyInput(value.amountCents));
    setDate(
      formatDateForDisplay(
        duplicateExpenseId ? getTodayDatabaseDate() : value.occurredOn,
      ),
    );
    setCategory(value.category);
    setDescription(value.description ?? '');
    setQuoteId(value.quoteId);
    setRecurring(value.recurring);
    setDirty(false);
  }
  const parsedDate = parseDateForDatabase(date);
  const cents = moneyInputToCentsText(amount);
  const valid =
    BigInt(cents) > 0n &&
    Boolean(parsedDate) &&
    (!parsedDate || parsedDate <= getTodayDatabaseDate()) &&
    (category !== 'outros' || description.trim().length > 0);
  const selectedQuote = quotes.data?.find((item) => item.id === quoteId);
  function submit() {
    if (!parsedDate || !valid) return;
    mutations.save.mutate(
      {
        id: expenseId,
        amountCents: cents,
        occurredOn: parsedDate,
        category,
        description,
        quoteId,
        recurring,
      },
      {
        onSuccess: (saved) => {
          discard.allowNextNavigation();
          setDirty(false);
          const id = (saved as { id: string }).id;
          if (!expenseId) router.replace(`/expenses/${id}/edit` as never);
        },
      },
    );
  }
  return (
    <Screen
      contentContainerStyle={styles.content}
      keyboardAvoiding
      safeAreaEdges={['top', 'bottom']}
    >
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback={'/expenses' as never}
        dismissToBackFallback
        title={expenseId ? 'Editar despesa' : 'Nova despesa'}
      />
      <Text color="textSecondary">
        Registre apenas gastos que já aconteceram.
      </Text>
      <MoneyInput
        label="Valor"
        onChangeText={(value) => {
          setAmount(maskBigIntMoneyInput(value));
          setDirty(true);
        }}
        value={amount}
      />
      <DateInput
        label="Data da despesa"
        onChangeText={(value) => {
          setDate(maskDateInput(value));
          setDirty(true);
        }}
        value={date}
        error={
          parsedDate && parsedDate > getTodayDatabaseDate()
            ? 'A data não pode estar no futuro.'
            : undefined
        }
      />
      <Select
        label="Categoria"
        onPress={() => setCategoryOpen(true)}
        value={expenseCategoryLabels[category]}
      />
      <Input
        label={category === 'outros' ? 'Descrição' : 'Descrição (opcional)'}
        maxLength={500}
        multiline
        onChangeText={(value) => {
          setDescription(value);
          setDirty(true);
        }}
        showCounter
        value={description}
        error={
          category === 'outros' && !description.trim()
            ? 'Obrigatória para Outros.'
            : undefined
        }
      />
      <Select
        label="Orçamento (opcional)"
        onPress={() => setQuoteOpen(true)}
        placeholder="Sem vínculo"
        value={
          selectedQuote
            ? `#${formatQuoteNumber(selectedQuote.quote_number)} · ${selectedQuote.client_name_snapshot}`
            : undefined
        }
      />
      <Switch
        description="Esta marcação não cria lançamentos automáticos."
        label="Despesa recorrente"
        onValueChange={(value) => {
          setRecurring(value);
          setDirty(true);
        }}
        value={recurring}
      />
      {mutations.save.isError ? (
        <InlineFeedback
          message={expenseErrorMessage(mutations.save.error)}
          variant="error"
        />
      ) : null}
      <Button
        disabled={!valid || mutations.save.isPending}
        label={expenseId ? 'Salvar alterações' : 'Salvar despesa'}
        loading={mutations.save.isPending}
        onPress={submit}
      />
      {!expenseId ? (
        <Text color="textMuted" variant="caption">
          Depois de salvar, você poderá anexar até três comprovantes.
        </Text>
      ) : null}
      {expenseId ? (
        <ExpenseReceiptSection
          businessId={businessId}
          expenseId={expenseId}
          userId={userId}
        />
      ) : null}
      <Dialog
        onClose={() => setCategoryOpen(false)}
        title="Selecionar categoria"
        visible={categoryOpen}
      >
        <View style={styles.chips}>
          {expenseCategories.map((value) => (
            <Chip
              key={value}
              label={expenseCategoryLabels[value]}
              onPress={() => {
                setCategory(value);
                setDirty(true);
                setCategoryOpen(false);
              }}
              selected={category === value}
            />
          ))}
        </View>
      </Dialog>
      <Dialog
        onClose={() => setQuoteOpen(false)}
        title="Vincular orçamento"
        visible={quoteOpen}
      >
        <Button
          label="Sem vínculo"
          onPress={() => {
            setQuoteId(null);
            setDirty(true);
            setQuoteOpen(false);
          }}
          variant="secondary"
        />
        {quotes.data?.map((item) => (
          <Button
            key={item.id}
            label={`#${formatQuoteNumber(item.quote_number)} · ${item.client_name_snapshot}`}
            onPress={() => {
              setQuoteId(item.id);
              setDirty(true);
              setQuoteOpen(false);
            }}
            variant="ghost"
          />
        ))}
      </Dialog>
      <ConfirmationDialog
        cancelLabel="Continuar editando"
        confirmLabel="Descartar alterações"
        description="As alterações feitas nesta despesa ainda não foram salvas."
        destructive
        onCancel={discard.cancelDiscard}
        onConfirm={discard.confirmDiscard}
        title="Descartar alterações?"
        visible={discard.visible}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
