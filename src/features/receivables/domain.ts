export const financialEntryTypes = ['receipt', 'refund'] as const;
export type FinancialEntryType = (typeof financialEntryTypes)[number];

export const paymentMethods = [
  'cash',
  'pix',
  'debit_card',
  'credit_card',
  'bank_transfer',
  'other',
] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Cartão de débito',
  credit_card: 'Cartão de crédito',
  bank_transfer: 'Transferência',
  other: 'Outro',
};

export interface FinancialEntry {
  id: string;
  type: FinancialEntryType;
  amountCents: string;
  occurredOn: string;
  paymentMethod: PaymentMethod;
  note: string | null;
  serviceOrderId: string | null;
  originalEntryId: string | null;
  createdAt: string;
}

export interface QuoteReceivable {
  quoteId: string;
  totalCents: string;
  receivedCents: string;
  refundedCents: string;
  balanceCents: string;
  settled: boolean;
  dueOn: string | null;
  entries: FinancialEntry[];
}

export function normalizeCents(value: string) {
  if (!/^\d+$/.test(value)) throw new Error('INVALID_CENTS');
  return BigInt(value).toString();
}

export function formatBigIntMoney(value: string | bigint) {
  const cents =
    typeof value === 'bigint' ? value : BigInt(normalizeCents(value));
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const integer = (absolute / 100n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const fraction = (absolute % 100n).toString().padStart(2, '0');
  return `${negative ? '- ' : ''}R$ ${integer},${fraction}`;
}

export function maskBigIntMoneyInput(value: string) {
  const digits = value
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 19);
  return formatBigIntMoney(BigInt(digits || '0'));
}

export function moneyInputToCentsText(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  return digits || '0';
}

export function receivableErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/QUOTE_NOT_APPROVED/.test(message))
    return 'Somente orçamentos aprovados podem receber lançamentos.';
  if (/AMOUNT_EXCEEDS_BALANCE/.test(message))
    return 'O valor ultrapassa o saldo devedor. Confira se pertence a outro orçamento.';
  if (/REFUND_EXCEEDS_NET_RECEIVED/.test(message))
    return 'O estorno ultrapassa o valor líquido já recebido.';
  if (/REFUND_EXCEEDS_ORIGINAL/.test(message))
    return 'O estorno ultrapassa o recebimento selecionado.';
  if (/REFUND_REASON_REQUIRED/.test(message))
    return 'Informe o motivo do estorno.';
  if (/INVALID_OCCURRED_ON/.test(message))
    return 'A data não pode estar no futuro.';
  if (/INVALID_AMOUNT/.test(message)) return 'Informe um valor maior que zero.';
  return 'Não foi possível registrar o lançamento. Atualize os dados e tente novamente.';
}
