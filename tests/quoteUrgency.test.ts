import {
  daysUntil,
  quoteTimingLabel,
  quoteUrgency,
} from '@/features/quotes/urgency';

const TODAY = '2026-09-02';

describe('daysUntil', () => {
  it('counts forward and backward from today', () => {
    expect(daysUntil('2026-09-02', TODAY)).toBe(0);
    expect(daysUntil('2026-09-05', TODAY)).toBe(3);
    expect(daysUntil('2026-08-30', TODAY)).toBe(-3);
  });

  // Datas cruzando mês e ano são onde uma subtração ingênua erra.
  it('crosses month and year boundaries', () => {
    expect(daysUntil('2026-10-02', TODAY)).toBe(30);
    expect(daysUntil('2027-01-01', TODAY)).toBe(121);
    expect(daysUntil('2025-09-02', TODAY)).toBe(-365);
  });
});

describe('quoteUrgency', () => {
  // Só um orçamento à espera de resposta perde valor com o tempo.
  it('stays quiet for anything that is not awaiting a reply', () => {
    expect(quoteUrgency('draft', '2026-09-03', TODAY)).toBe('none');
    expect(quoteUrgency('approved', '2026-08-01', TODAY)).toBe('none');
    expect(quoteUrgency('rejected', '2026-08-01', TODAY)).toBe('none');
    expect(quoteUrgency('canceled', '2026-08-01', TODAY)).toBe('none');
  });

  it('flags a sent quote as it approaches its deadline', () => {
    expect(quoteUrgency('sent', '2026-09-20', TODAY)).toBe('none');
    expect(quoteUrgency('sent', '2026-09-05', TODAY)).toBe('due');
    expect(quoteUrgency('sent', '2026-09-02', TODAY)).toBe('due');
    expect(quoteUrgency('sent', '2026-09-01', TODAY)).toBe('expired');
  });

  it('trusts the status when it already says expired', () => {
    expect(quoteUrgency('expired', '2026-12-01', TODAY)).toBe('expired');
  });
});

describe('quoteTimingLabel', () => {
  // O selo de status ao lado já anuncia o desfecho; a linha de tempo não
  // repete, mostra a emissão, que ainda acrescenta.
  it('falls back to the issue date once the quote has an outcome', () => {
    expect(quoteTimingLabel('draft', '2026-09-01', '2026-10-01', TODAY)).toBe(
      'Emitido em 01/09/2026',
    );
    expect(
      quoteTimingLabel('approved', '2026-08-01', '2026-09-01', TODAY),
    ).toBe('Emitido em 01/08/2026');
  });

  it('counts down while the deadline is near', () => {
    expect(quoteTimingLabel('sent', '2026-08-25', '2026-09-02', TODAY)).toBe(
      'Vence hoje',
    );
    expect(quoteTimingLabel('sent', '2026-08-25', '2026-09-03', TODAY)).toBe(
      'Vence amanhã',
    );
    expect(quoteTimingLabel('sent', '2026-08-25', '2026-09-06', TODAY)).toBe(
      'Vence em 4 dias',
    );
  });

  it('counts up once the deadline has passed', () => {
    expect(quoteTimingLabel('sent', '2026-08-01', '2026-09-01', TODAY)).toBe(
      'Expirou ontem',
    );
    expect(quoteTimingLabel('expired', '2026-08-01', '2026-08-28', TODAY)).toBe(
      'Expirou há 5 dias',
    );
  });

  // Longe do vencimento, a espera por resposta é o que exige decisão.
  it('reports the wait while the deadline is still far off', () => {
    expect(quoteTimingLabel('sent', '2026-09-02', '2026-10-02', TODAY)).toBe(
      'Enviado hoje',
    );
    expect(quoteTimingLabel('sent', '2026-09-01', '2026-10-02', TODAY)).toBe(
      'Enviado ontem',
    );
    expect(quoteTimingLabel('sent', '2026-08-25', '2026-10-02', TODAY)).toBe(
      'Enviado há 8 dias',
    );
  });
});
