import type { ClientStatusFilter } from './api';
import type { ReconnectClient } from '@/features/relationships/domain';

/**
 * O filtro da tela tem uma opção a mais que o do servidor: "para retomar" não
 * é um estado do cadastro, é uma condição derivada do tempo desde o último
 * atendimento. `listClients` não sabe calcular isso, então essa opção consulta
 * a lista completa e filtra em memória.
 */
export type ClientListFilter = ClientStatusFilter | 'reconnect';

/** O valor que a consulta do servidor aceita. */
export function serverStatusFor(filter: ClientListFilter): ClientStatusFilter {
  // "Para retomar" já implica cliente ativo — um inativo não é retomado.
  return filter === 'reconnect' ? 'active' : filter;
}

/**
 * Índice de quem está vencido, montado uma vez por carga em vez de uma busca
 * por linha: com a lista paginada, procurar dentro de um array a cada linha
 * seria O(n×m) enquanto o usuário rola.
 */
export function reconnectIndex(
  clients: readonly ReconnectClient[] | undefined,
) {
  return new Map(
    (clients ?? []).map((client) => [client.id, client.daysSince]),
  );
}

/**
 * Só a parte temporal, para onde já existe um rótulo dizendo do que se trata
 * — "Último atendimento: Atendido há 3 meses" diria a mesma coisa duas vezes.
 */
export function elapsedLabel(daysSince: number | undefined): string {
  if (daysSince === undefined) return 'Nenhum concluído';
  if (daysSince === 0) return 'Hoje';
  if (daysSince === 1) return 'Ontem';
  if (daysSince < 30) return `Há ${daysSince} dias`;
  const months = Math.floor(daysSince / 30);
  if (months === 1) return 'Há 1 mês';
  if (months < 12) return `Há ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'Há 1 ano' : `Há ${years} anos`;
}

/** Rótulo relativo do último atendimento, para o lugar do telefone na linha. */
export function lastVisitLabel(daysSince: number | undefined): string {
  if (daysSince === undefined) return 'Sem atendimento concluído';
  if (daysSince === 0) return 'Atendido hoje';
  if (daysSince === 1) return 'Atendido ontem';
  return `Atendido ${elapsedLabel(daysSince).toLowerCase()}`;
}
