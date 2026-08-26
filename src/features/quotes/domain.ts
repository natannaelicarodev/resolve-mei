export const quoteStatuses = [
  'draft',
  'sent',
  'approved',
  'rejected',
  'canceled',
] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];
export type DisplayQuoteStatus = QuoteStatus | 'expired';

export const quoteStatusLabels: Record<DisplayQuoteStatus, string> = {
  draft: 'Rascunho',
  sent: 'Enviado',
  approved: 'Aprovado',
  rejected: 'Recusado',
  expired: 'Expirado',
  canceled: 'Cancelado',
};

export const allowedQuoteTransitions: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ['sent', 'canceled'],
  sent: ['approved', 'rejected', 'canceled'],
  approved: [],
  rejected: [],
  canceled: [],
};

export function canEditQuote(status: QuoteStatus) {
  return status === 'draft';
}

export function canTransitionQuote(from: QuoteStatus, to: QuoteStatus) {
  return allowedQuoteTransitions[from].includes(to);
}

export function getDisplayQuoteStatus(
  status: QuoteStatus,
  validUntil: string,
  today = new Date(),
): DisplayQuoteStatus {
  if (status === 'sent' && validUntil < today.toISOString().slice(0, 10))
    return 'expired';
  return status;
}

export function calculateItemTotal(quantity: number, unitPriceCents: number) {
  return Math.max(0, Math.trunc(quantity)) * Math.max(0, unitPriceCents);
}

export function calculateQuoteTotals(
  items: { quantity: number; unitPriceCents: number }[],
  discountCents: number,
) {
  const subtotalCents = items.reduce(
    (sum, item) => sum + calculateItemTotal(item.quantity, item.unitPriceCents),
    0,
  );
  const safeDiscount = Math.max(0, discountCents);
  return {
    subtotalCents,
    discountCents: safeDiscount,
    totalCents: Math.max(0, subtotalCents - safeDiscount),
  };
}

export function formatQuoteNumber(value: number) {
  return String(value).padStart(6, '0');
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function moneyInputToCents(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export function centsToMoneyInput(cents: number) {
  return formatMoney(cents);
}
