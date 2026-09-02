export type ExpectedReturnDays = 30 | 60 | 90 | 180 | 365;
export const expectedReturnOptions = [30, 60, 90, 180, 365] as const;
export function expectedReturnValue(value: string): ExpectedReturnDays | null {
  if (value === 'default') return null;
  const days = Number(value);
  if (expectedReturnOptions.some(option => option === days)) return days as ExpectedReturnDays;
  throw new Error('INVALID_EXPECTED_RETURN_DAYS');
}
export interface ReturnInterval {
  expectedReturnDays: ExpectedReturnDays | null;
  effectiveReturnDays: number;
  usesBusinessDefault: boolean;
}
export interface RelationshipProfile extends ReturnInterval { recurring: boolean; priority: boolean }
export interface RelationshipOrder {
  id: string; quoteId: string; status: 'pending'|'in_progress'|'paused'|'completed'|'canceled'; createdAt: string;
  lastCompletedAt: string | null; satisfaction: number | null;
  observation: string | null; noteUpdatedAt: string | null;
}

export function relationshipOrderCompletionLabel(order: Pick<RelationshipOrder,'status'|'lastCompletedAt'>) {
  if (!order.lastCompletedAt) return 'Ainda sem conclusão.';
  if (order.status === 'in_progress' || order.status === 'paused')
    return 'Ordem reaberta · conclusão anterior preservada';
  if (order.status === 'canceled')
    return 'Ordem cancelada após atendimento concluído';
  return 'Atendimento concluído';
}
export interface RelationshipOverview {
  profile: RelationshipProfile; lastCompletedAt: string | null; daysSince: number | null;
  receivedCents: string; quotes: { id:string; number:number; status:string; issuedOn:string; totalCents:string }[];
  orders: RelationshipOrder[];
}
export interface ReconnectClient extends RelationshipProfile {
  id:string; name:string; phone:string|null; lastCompletedAt:string; daysSince:number;
}
export interface ReconnectOverview { reconnectAfterDays:number; clients:ReconnectClient[] }

export const relationshipTemplates = [
  { id:'reconnect', label:'Retomar contato', text:'Olá, {cliente}! Aqui é da {empresa}. Faz um tempo desde nosso último atendimento, em {data}. Como você está? Podemos ajudar com algo novo?' },
  { id:'satisfaction', label:'Saber como foi', text:'Olá, {cliente}! Aqui é da {empresa}. Gostaria de saber como ficou o serviço realizado em {data}. Está tudo certo?' },
  { id:'availability', label:'Oferecer disponibilidade', text:'Olá, {cliente}! Aqui é da {empresa}. Estamos organizando nossa agenda e lembramos do seu último atendimento em {data}. Se precisar de algo, estamos à disposição.' },
] as const;

export function relationshipMessage(template:string, values:{clientName:string;businessName:string;lastCompletedAt:string}) {
  const date = new Intl.DateTimeFormat('pt-BR', { timeZone:'America/Sao_Paulo' }).format(new Date(values.lastCompletedAt));
  return template.replaceAll('{cliente}', values.clientName).replaceAll('{empresa}', values.businessName).replaceAll('{data}', date);
}

export function whatsappMessageUrl(phone:string, message:string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  if (digits.length < 12 || digits.length > 13) throw new Error('INVALID_WHATSAPP_PHONE');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
