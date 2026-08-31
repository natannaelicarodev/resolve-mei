import type { Quote } from '@/features/quotes/api';
import { getDisplayQuoteStatus } from '@/features/quotes/domain';
import type { DisplayQuoteStatus } from '@/features/quotes/domain';

// The service lifecycle the product is built around. Only the first three
// stages exist in the database today: `quotes.status` goes draft -> sent ->
// approved and stops, because `allowedQuoteTransitions.approved` is empty.
// The remaining stages are drawn but marked, so the Home never claims
// functionality the schema cannot back.
export const pipelineStages = [
  'draft',
  'sent',
  'approved',
  'scheduled',
  'running',
  'done',
  'billed',
  'paid',
] as const;

export type PipelineStage = (typeof pipelineStages)[number];

export interface PipelineStageMeta {
  /** Short label used on the rail marker. */
  short: string;
  /** Full label used in section headers and accessibility copy. */
  label: string;
  /** True when a real table/column backs this stage today. */
  inSchema: boolean;
  /** The table or column that would carry it, for the proposal marker. */
  source: string;
}

export const stageMeta: Record<PipelineStage, PipelineStageMeta> = {
  draft: {
    short: 'Rascunho',
    label: 'Rascunho',
    inSchema: true,
    source: 'quotes.status',
  },
  sent: {
    short: 'Enviado',
    label: 'Enviado, aguardando resposta',
    inSchema: true,
    source: 'quotes.status',
  },
  approved: {
    short: 'Aprovado',
    label: 'Aprovado',
    inSchema: true,
    source: 'quotes.status',
  },
  scheduled: {
    short: 'Agendado',
    label: 'Agendado',
    inSchema: false,
    source: 'appointments',
  },
  running: {
    short: 'Execução',
    label: 'Em execução',
    inSchema: false,
    source: 'appointments.started_at',
  },
  done: {
    short: 'Concluído',
    label: 'Concluído, não cobrado',
    inSchema: false,
    source: 'appointments.finished_at',
  },
  billed: {
    short: 'Cobrado',
    label: 'Cobrado',
    inSchema: false,
    source: 'invoices',
  },
  paid: {
    short: 'Recebido',
    label: 'Recebido',
    inSchema: false,
    source: 'payments',
  },
};

export const schemaBackedStages = pipelineStages.filter(
  (stage) => stageMeta[stage].inSchema,
);

/**
 * Why a quote is stuck, ordered by how much it costs the owner to ignore.
 * `expired` outranks everything because the money is already leaking.
 */
export type BlockReason =
  'expired' | 'expiring' | 'waiting' | 'unsent' | 'closed';

export interface PipelineEntry {
  quote: Quote;
  stage: PipelineStage;
  displayStatus: DisplayQuoteStatus;
  reason: BlockReason;
  /** Whole days since the quote was issued. Never negative. */
  ageDays: number;
  /** Whole days until validity ends. Negative once expired. */
  daysToDeadline: number;
  /** Money the owner cannot collect while this sits here. */
  blockedCents: number;
}

const DAY_MS = 86_400_000;

function startOfDay(value: Date) {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDatabaseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

/**
 * Whole days between a database date and today. Positive means the date is in
 * the future. Returns 0 when the date cannot be parsed, so a malformed row
 * degrades to "neutral" instead of crashing the Home.
 */
export function daysBetween(value: string, today = new Date()) {
  const target = parseDatabaseDate(value);
  if (target === null) return 0;
  return Math.round((target - startOfDay(today)) / DAY_MS);
}

const reasonRank: Record<BlockReason, number> = {
  expired: 0,
  expiring: 1,
  waiting: 2,
  unsent: 3,
  closed: 4,
};

export function describeBlock(entry: PipelineEntry): string {
  const { reason, daysToDeadline, ageDays } = entry;
  if (reason === 'expired') {
    const late = Math.abs(daysToDeadline);
    return late === 0
      ? 'A validade venceu hoje e não houve resposta.'
      : `A validade venceu há ${late} ${late === 1 ? 'dia' : 'dias'} e não houve resposta.`;
  }
  if (reason === 'expiring')
    return daysToDeadline === 0
      ? 'Vence hoje. É a última chance de cobrar resposta.'
      : `Vence em ${daysToDeadline} ${daysToDeadline === 1 ? 'dia' : 'dias'}. Ainda dá tempo de cobrar resposta.`;
  if (reason === 'waiting')
    return `Enviado há ${ageDays} ${ageDays === 1 ? 'dia' : 'dias'} e ainda sem resposta.`;
  if (reason === 'unsent')
    return ageDays === 0
      ? 'Criado hoje e ainda não enviado. O cliente não vê rascunho.'
      : `Parado há ${ageDays} ${ageDays === 1 ? 'dia' : 'dias'} sem enviar. O cliente não vê rascunho.`;
  return 'Aprovado. O próximo passo depende de agenda, que ainda não existe no app.';
}

/** The single verb this entry is waiting on. Empty when nothing is allowed. */
export function nextActionLabel(reason: BlockReason): string {
  if (reason === 'expired' || reason === 'expiring' || reason === 'waiting')
    return 'Cobrar resposta';
  if (reason === 'unsent') return 'Enviar ao cliente';
  return '';
}

function classify(
  quote: Quote,
  displayStatus: DisplayQuoteStatus,
  daysToDeadline: number,
): BlockReason {
  if (displayStatus === 'expired') return 'expired';
  if (quote.status === 'draft') return 'unsent';
  if (quote.status === 'sent')
    return daysToDeadline <= 2 ? 'expiring' : 'waiting';
  return 'closed';
}

/**
 * Turns raw quotes into the vertical rail the Home renders, ordered by what
 * costs the owner most to leave alone: reason first, then money at stake.
 * Rejected and canceled quotes are dropped — nothing is waiting on them.
 */
export function buildPipeline(
  quotes: Quote[],
  today = new Date(),
): PipelineEntry[] {
  return quotes
    .filter(
      (quote) => quote.status !== 'rejected' && quote.status !== 'canceled',
    )
    .map((quote) => {
      const displayStatus = getDisplayQuoteStatus(
        quote.status,
        quote.valid_until,
        today,
      );
      const daysToDeadline = daysBetween(quote.valid_until, today);
      const ageDays = Math.max(0, -daysBetween(quote.issued_on, today));
      const reason = classify(quote, displayStatus, daysToDeadline);
      return {
        quote,
        stage: quote.status as PipelineStage,
        displayStatus,
        reason,
        ageDays,
        daysToDeadline,
        blockedCents: quote.total_cents,
      };
    })
    .sort((left, right) => {
      const byReason = reasonRank[left.reason] - reasonRank[right.reason];
      if (byReason !== 0) return byReason;
      return right.blockedCents - left.blockedCents;
    });
}

export interface PipelineSummary {
  /** Money sitting in stages that still need an action. */
  blockedCents: number;
  /** How many entries need an action. */
  blockedCount: number;
  /** Money already approved — earned, but not collectable in-app yet. */
  approvedCents: number;
  /** Count per stage, including the stages that have no table yet. */
  countByStage: Record<PipelineStage, number>;
  /** The entry that costs the most to ignore, if any. */
  lead: PipelineEntry | null;
}

export function summarizePipeline(entries: PipelineEntry[]): PipelineSummary {
  const countByStage = Object.fromEntries(
    pipelineStages.map((stage) => [stage, 0]),
  ) as Record<PipelineStage, number>;
  let blockedCents = 0;
  let blockedCount = 0;
  let approvedCents = 0;
  for (const entry of entries) {
    const stage = entry.displayStatus === 'expired' ? 'sent' : entry.stage;
    countByStage[stage] += 1;
    if (entry.reason === 'closed') approvedCents += entry.blockedCents;
    else {
      blockedCents += entry.blockedCents;
      blockedCount += 1;
    }
  }
  return {
    blockedCents,
    blockedCount,
    approvedCents,
    countByStage,
    lead: entries[0] ?? null,
  };
}
