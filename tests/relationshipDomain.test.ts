import { relationshipMessage, relationshipOrderCompletionLabel, whatsappMessageUrl } from '@/features/relationships/domain';

describe('relationship messages', () => {
  it('replaces every approved variable before the owner reviews the text', () => {
    expect(relationshipMessage(
      'Olá, {cliente}. {empresa}: {data}.',
      { clientName:'Ana', businessName:'ResolveMEI', lastCompletedAt:'2026-08-31T15:00:00-03:00' },
    )).toBe('Olá, Ana. ResolveMEI: 31/08/2026.');
  });

  it('builds a Brazilian wa.me link with an encoded, editable message', () => {
    expect(whatsappMessageUrl('(11) 99999-1234', 'Olá, Ana!')).toBe(
      'https://wa.me/5511999991234?text=Ol%C3%A1%2C%20Ana!',
    );
  });

  it('rejects an invalid phone instead of opening the wrong conversation', () => {
    expect(() => whatsappMessageUrl('123', 'Olá')).toThrow('INVALID_WHATSAPP_PHONE');
  });

  it('explains historical completion after reopen or cancellation', () => {
    expect(relationshipOrderCompletionLabel({status:'in_progress',lastCompletedAt:'2026-08-31'})).toBe('Ordem reaberta · conclusão anterior preservada');
    expect(relationshipOrderCompletionLabel({status:'canceled',lastCompletedAt:'2026-08-31'})).toBe('Ordem cancelada após atendimento concluído');
  });
});
