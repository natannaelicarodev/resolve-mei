const DISPLAY_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const DATABASE_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidParts(year: number, month: number, day: number) {
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= daysInMonth;
}

export function maskDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isValidCalendarDate(value: string) {
  const match = DISPLAY_DATE.exec(value);
  if (!match) return false;
  const [, day, month, year] = match;
  return isValidParts(Number(year), Number(month), Number(day));
}

export function parseDateForDatabase(value: string) {
  const match = DISPLAY_DATE.exec(value);
  if (!match || !isValidCalendarDate(value)) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

export function formatDateForDisplay(value: string) {
  const match = DATABASE_DATE.exec(value);
  if (!match) return '';
  const [, year, month, day] = match;
  const display = `${day}/${month}/${year}`;
  return isValidCalendarDate(display) ? display : '';
}

export function getTodayDatabaseDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function addDaysToDatabaseDate(value: string, days: number) {
  const match = DATABASE_DATE.exec(value);
  if (!match) return '';
  const [, year, month, day] = match;
  const result = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day) + days),
  );
  return [
    String(result.getUTCFullYear()).padStart(4, '0'),
    String(result.getUTCMonth() + 1).padStart(2, '0'),
    String(result.getUTCDate()).padStart(2, '0'),
  ].join('-');
}
