const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatPriceCents(cents: number): string {
  return BRL_FORMATTER.format(cents / 100);
}

export function parsePriceInput(value: string): number | null {
  if (value.includes('-')) return null;
  const digits = value.replace(/\D/g, '');
  if (!digits) return null;
  const cents = Number(digits);
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatPriceInput(value: string): string {
  const cents = parsePriceInput(value);
  return cents === null ? value : formatPriceCents(cents);
}

export function formatDuration(minutes?: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours} h`;
  return `${hours} h ${remainder} min`;
}
