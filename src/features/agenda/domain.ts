import { formatDateForDisplay } from '@/features/quotes/date';

export const appointmentStatuses = [
  'scheduled',
  'completed',
  'rescheduled',
  'canceled',
] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export interface ServiceAppointment {
  id: string;
  service_order_id: string;
  business_id: string;
  client_id: string;
  scheduled_on: string;
  scheduled_time: string | null;
  status: AppointmentStatus;
  note: string | null;
  resolution_note: string | null;
  rescheduled_from_id: string | null;
  actor_user_id: string;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AgendaAppointment {
  id: string;
  serviceOrderId: string;
  scheduledOn: string;
  scheduledTime: string | null;
  note: string | null;
  clientName: string;
  quoteNumber: number;
  overdue: boolean;
}

export interface FinancialDueToday {
  quoteId: string;
  quoteNumber: number;
  clientName: string;
  balanceCents: string;
}

export interface AgendaOverview {
  today: string;
  appointments: AgendaAppointment[];
  financialDueToday: FinancialDueToday[];
}

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Visita agendada',
  completed: 'Visita realizada',
  rescheduled: 'Visita remarcada',
  canceled: 'Agendamento cancelado',
};

export function formatAppointmentDate(date: string, time?: string | null) {
  const display = formatDateForDisplay(date);
  return time ? `${display}, ${time.slice(0, 5)}` : display;
}

export function maskTimeInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2
    ? digits
    : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function parseTimeForDatabase(value: string) {
  if (!value.trim()) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return undefined;
  return `${match[1]}:${match[2]}:00`;
}

export interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
}

/** Mês atual no fuso do negócio, formato `YYYY-MM-01` — mesma convenção usada em Despesas. */
export function currentCalendarMonth(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-01`;
}

export function moveCalendarMonth(month: string, offset: number) {
  const [year = 1970, value = 1] = month.split('-').map(Number);
  const result = new Date(Date.UTC(year, value - 1 + offset, 1));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export function calendarMonthLabel(month: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(new Date(`${month}T00:00:00Z`))
    .replace(' de ', ' ');
}

/**
 * Grade de semanas completas (domingo a sábado) cobrindo o mês: dias de fora
 * do mês entram para preencher a primeira e a última semana, mas marcados
 * `inMonth: false` — não são tocáveis nem contam visitas.
 */
export function calendarGrid(month: string): CalendarDay[] {
  const [year = 1970, value = 1] = month.split('-').map(Number);
  const firstOfMonth = new Date(Date.UTC(year, value - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, value, 0)).getUTCDate();
  const leadingBlanks = firstOfMonth.getUTCDay();
  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;
  const toDateKey = (date: Date) =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(Date.UTC(year, value - 1, index - leadingBlanks + 1));
    return {
      date: toDateKey(date),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === value - 1,
    };
  });
}

export function agendaErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/APPOINTMENT_DATE_IN_PAST/.test(message))
    return 'Escolha hoje ou uma data futura.';
  if (/ACTIVE_APPOINTMENT_EXISTS/.test(message))
    return 'Esta ordem já possui uma visita agendada.';
  if (/SERVICE_ORDER_TERMINAL/.test(message))
    return 'Ordens concluídas ou canceladas não podem receber agendamentos.';
  if (/APPOINTMENT_STALE/.test(message))
    return 'O agendamento mudou em outro dispositivo. Atualize e tente novamente.';
  if (/NOTE_TOO_LONG/.test(message))
    return 'A observação deve ter no máximo 500 caracteres.';
  return 'Não foi possível concluir a ação. Tente novamente.';
}
