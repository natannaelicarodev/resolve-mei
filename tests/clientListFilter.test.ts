import {
  lastVisitLabel,
  reconnectIndex,
  serverStatusFor,
} from '@/features/clients/listFilter';
import type { ReconnectClient } from '@/features/relationships/domain';

describe('serverStatusFor', () => {
  it('passes the cadastral filters straight through', () => {
    expect(serverStatusFor('all')).toBe('all');
    expect(serverStatusFor('active')).toBe('active');
    expect(serverStatusFor('inactive')).toBe('inactive');
  });

  // "Para retomar" não é um estado do cadastro: o servidor não sabe calculá-lo,
  // e um cliente inativo não é candidato a retomada.
  it('narrows the reconnect filter to active clients on the server', () => {
    expect(serverStatusFor('reconnect')).toBe('active');
  });
});

describe('reconnectIndex', () => {
  const clients = [
    { id: 'client-1', daysSince: 45 },
    { id: 'client-2', daysSince: 120 },
  ] as ReconnectClient[];

  it('indexes days since by client id', () => {
    const index = reconnectIndex(clients);
    expect(index.get('client-1')).toBe(45);
    expect(index.get('client-2')).toBe(120);
    expect(index.get('client-3')).toBeUndefined();
  });

  // A consulta pode não ter carregado ainda; a lista tem que renderizar mesmo
  // assim, só sem os marcadores.
  it('survives an absent list', () => {
    expect(reconnectIndex(undefined).size).toBe(0);
  });
});

describe('lastVisitLabel', () => {
  it('names the recent days in words the user would use', () => {
    expect(lastVisitLabel(0)).toBe('Atendido hoje');
    expect(lastVisitLabel(1)).toBe('Atendido ontem');
    expect(lastVisitLabel(12)).toBe('Atendido há 12 dias');
  });

  it('switches to months and years as the gap grows', () => {
    expect(lastVisitLabel(30)).toBe('Atendido há 1 mês');
    expect(lastVisitLabel(90)).toBe('Atendido há 3 meses');
    expect(lastVisitLabel(365)).toBe('Atendido há 1 ano');
    expect(lastVisitLabel(800)).toBe('Atendido há 2 anos');
  });

  // Um cliente cadastrado que nunca teve ordem concluída não aparece na
  // consulta de retomada — a linha não pode ficar vazia por isso.
  it('says so when there is no completed service yet', () => {
    expect(lastVisitLabel(undefined)).toBe('Sem atendimento concluído');
  });
});
