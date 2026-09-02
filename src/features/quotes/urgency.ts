import { formatDateForDisplay, getTodayDatabaseDate } from './date';
import type { DisplayQuoteStatus } from './domain';

/**
 * Quanto a linha da lista precisa chamar atenção. Um orçamento enviado é a
 * única coisa do app que perde valor sozinha com o tempo — a data de validade
 * absoluta não comunica isso, porque obriga o usuário a calcular de cabeça.
 */
export type QuoteUrgency = 'none' | 'due' | 'expired';

/** Dias restantes até a validade. Negativo quando já passou. */
export function daysUntil(validUntil: string, today = getTodayDatabaseDate()) {
  const toUtc = (value: string) =>
    Date.UTC(
      Number(value.slice(0, 4)),
      Number(value.slice(5, 7)) - 1,
      Number(value.slice(8, 10)),
    );
  return Math.round((toUtc(validUntil) - toUtc(today)) / 86_400_000);
}

/**
 * Só um orçamento à espera de resposta tem urgência: um rascunho ainda não foi
 * enviado, e um já aprovado ou recusado teve seu desfecho.
 */
export function quoteUrgency(
  status: DisplayQuoteStatus,
  validUntil: string,
  today = getTodayDatabaseDate(),
): QuoteUrgency {
  if (status === 'expired') return 'expired';
  if (status !== 'sent') return 'none';
  const days = daysUntil(validUntil, today);
  if (days < 0) return 'expired';
  return days <= 3 ? 'due' : 'none';
}

/**
 * O que a linha diz no lugar de "emissão 26/08 · validade 26/09". A data
 * absoluta continua no detalhe; aqui vale o que exige decisão.
 */
export function quoteTimingLabel(
  status: DisplayQuoteStatus,
  issuedOn: string,
  validUntil: string,
  today = getTodayDatabaseDate(),
): string {
  // Um desfecho já é anunciado pelo selo de status ao lado; repeti-lo aqui
  // gastaria a linha dizendo duas vezes a mesma coisa. Nesses casos a data de
  // emissão é o que ainda acrescenta.
  if (status !== 'sent' && status !== 'expired')
    return `Emitido em ${formatDateForDisplay(issuedOn)}`;

  const remaining = daysUntil(validUntil, today);
  if (remaining < 0) {
    const gone = Math.abs(remaining);
    return gone === 1 ? 'Expirou ontem' : `Expirou há ${gone} dias`;
  }
  if (remaining === 0) return 'Vence hoje';
  if (remaining === 1) return 'Vence amanhã';
  if (remaining <= 7) return `Vence em ${remaining} dias`;

  // Longe do vencimento, o que importa é há quanto tempo espera resposta.
  const waiting = -daysUntil(issuedOn, today);
  if (waiting <= 0) return 'Enviado hoje';
  if (waiting === 1) return 'Enviado ontem';
  return `Enviado há ${waiting} dias`;
}
