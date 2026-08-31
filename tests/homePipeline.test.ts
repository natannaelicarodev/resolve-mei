import {
  buildPipeline,
  daysBetween,
  describeBlock,
  nextActionLabel,
  pipelineStages,
  schemaBackedStages,
  stageMeta,
  summarizePipeline,
} from '@/features/home/pipeline';
import { allowedQuoteTransitions } from '@/features/quotes/domain';
import type { Quote } from '@/features/quotes/api';

const TODAY = new Date(2026, 7, 30);

function quote(overrides: Partial<Quote>): Quote {
  return {
    id: 'quote-1',
    business_id: 'business-1',
    client_id: 'client-1',
    client_name_snapshot: 'Marina Duarte',
    client_document_snapshot: null,
    client_phone_snapshot: null,
    client_email_snapshot: null,
    quote_number: 102,
    status: 'sent',
    issued_on: '2026-08-20',
    valid_until: '2026-09-10',
    total_cents: 420000,
    subtotal_cents: 420000,
    discount_cents: 0,
    notes: null,
    created_at: '2026-08-20T12:00:00Z',
    updated_at: '2026-08-20T12:00:00Z',
    ...overrides,
  };
}

describe('pipeline stage catalog', () => {
  it('marks exactly the three stages the database can back today', () => {
    expect(schemaBackedStages).toEqual(['draft', 'sent', 'approved']);
    expect(pipelineStages).toHaveLength(8);
  });

  it('keeps approved as the last reachable stage, matching the domain rules', () => {
    // The proposal stages exist only because the quote lifecycle dead-ends
    // here. If this ever gains transitions, the marked stages must be revisited.
    expect(allowedQuoteTransitions.approved).toEqual([]);
    expect(stageMeta.scheduled.inSchema).toBe(false);
    expect(stageMeta.scheduled.source).toBe('appointments');
  });
});

describe('daysBetween', () => {
  it('counts whole days forward and backward from today', () => {
    expect(daysBetween('2026-09-02', TODAY)).toBe(3);
    expect(daysBetween('2026-08-30', TODAY)).toBe(0);
    expect(daysBetween('2026-08-24', TODAY)).toBe(-6);
  });

  it('degrades to neutral instead of throwing on a malformed date', () => {
    expect(daysBetween('not-a-date', TODAY)).toBe(0);
  });
});

describe('buildPipeline ordering', () => {
  it('ranks by what costs most to ignore, then by money at stake', () => {
    const entries = buildPipeline(
      [
        quote({ id: 'draft', status: 'draft', total_cents: 900000 }),
        quote({
          id: 'expired',
          valid_until: '2026-08-20',
          total_cents: 100000,
        }),
        quote({ id: 'waiting', valid_until: '2026-09-20' }),
        quote({
          id: 'expiring',
          valid_until: '2026-08-31',
          total_cents: 50000,
        }),
      ],
      TODAY,
    );
    expect(entries.map((entry) => entry.quote.id)).toEqual([
      'expired',
      'expiring',
      'waiting',
      'draft',
    ]);
  });

  it('breaks ties inside a reason by the larger blocked amount', () => {
    const entries = buildPipeline(
      [
        quote({ id: 'small', valid_until: '2026-08-01', total_cents: 10000 }),
        quote({ id: 'big', valid_until: '2026-08-01', total_cents: 990000 }),
      ],
      TODAY,
    );
    expect(entries.map((entry) => entry.quote.id)).toEqual(['big', 'small']);
  });

  it('drops quotes nobody is waiting on', () => {
    const entries = buildPipeline(
      [
        quote({ id: 'rejected', status: 'rejected' }),
        quote({ id: 'canceled', status: 'canceled' }),
        quote({ id: 'live' }),
      ],
      TODAY,
    );
    expect(entries.map((entry) => entry.quote.id)).toEqual(['live']);
  });
});

describe('block descriptions', () => {
  it('names the real deadline in plain Portuguese', () => {
    const [expired] = buildPipeline(
      [quote({ valid_until: '2026-08-24' })],
      TODAY,
    );
    expect(expired).toBeDefined();
    expect(describeBlock(expired!)).toBe(
      'A validade venceu há 6 dias e não houve resposta.',
    );
  });

  it('uses singular wording on the one-day boundary', () => {
    const [expiring] = buildPipeline(
      [quote({ valid_until: '2026-08-31' })],
      TODAY,
    );
    expect(describeBlock(expiring!)).toBe(
      'Vence em 1 dia. Ainda dá tempo de cobrar resposta.',
    );
  });

  it('says a draft is invisible to the client', () => {
    const [draft] = buildPipeline(
      [quote({ status: 'draft', issued_on: '2026-08-30' })],
      TODAY,
    );
    expect(describeBlock(draft!)).toBe(
      'Criado hoje e ainda não enviado. O cliente não vê rascunho.',
    );
  });

  it('is explicit that an approved quote has nowhere to go in the app', () => {
    const [approved] = buildPipeline([quote({ status: 'approved' })], TODAY);
    expect(approved!.reason).toBe('closed');
    expect(describeBlock(approved!)).toContain('ainda não existe no app');
    expect(nextActionLabel(approved!.reason)).toBe('');
  });

  it('gives every actionable reason exactly one verb', () => {
    expect(nextActionLabel('expired')).toBe('Cobrar resposta');
    expect(nextActionLabel('unsent')).toBe('Enviar ao cliente');
  });
});

describe('summarizePipeline', () => {
  it('separates money that is blocked from money already approved', () => {
    const summary = summarizePipeline(
      buildPipeline(
        [
          quote({ id: 'a', valid_until: '2026-08-20', total_cents: 300000 }),
          quote({ id: 'b', status: 'draft', total_cents: 200000 }),
          quote({ id: 'c', status: 'approved', total_cents: 500000 }),
        ],
        TODAY,
      ),
    );
    expect(summary.blockedCents).toBe(500000);
    expect(summary.blockedCount).toBe(2);
    expect(summary.approvedCents).toBe(500000);
    expect(summary.lead?.quote.id).toBe('a');
  });

  it('counts an expired quote under the stage it actually sits in', () => {
    const summary = summarizePipeline(
      buildPipeline([quote({ valid_until: '2026-08-01' })], TODAY),
    );
    expect(summary.countByStage.sent).toBe(1);
    expect(summary.countByStage.paid).toBe(0);
  });

  it('reports an empty pipeline without a lead', () => {
    const summary = summarizePipeline([]);
    expect(summary.blockedCount).toBe(0);
    expect(summary.lead).toBeNull();
  });
});
