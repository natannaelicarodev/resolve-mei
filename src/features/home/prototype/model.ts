export type PrototypeModuleId = 'activity' | 'cashflow';
export type QuickActionId = 'income' | 'invoice';

export interface BusinessSnapshot {
  cashAvailableCents: number;
  dasDueCents: number;
  dasDueLabel: string;
  accruedRevenueCents: number;
  invoicesIssuedCount: number;
  updatedAtLabel: string;
  nextMoveTitle: string;
  nextMoveDetail: string;
}

export interface BusinessActivity {
  id: string;
  title: string;
  detail: string;
  amountCents?: number;
  tone: 'positive' | 'neutral' | 'attention';
}

export interface CashflowPoint {
  label: string;
  valueCents: number;
}

export const prototypeModules: PrototypeModuleId[] = ['activity', 'cashflow'];

export const prototypeSnapshot: BusinessSnapshot = {
  cashAvailableCents: 1845000,
  dasDueCents: 89000,
  dasDueLabel: 'DAS de agosto · vence em 5 dias',
  accruedRevenueCents: 3278000,
  invoicesIssuedCount: 14,
  updatedAtLabel: 'agora',
  nextMoveTitle: 'Cobre o orçamento da Marina',
  nextMoveDetail: 'Aprovado há 3 dias e ainda sem nota emitida.',
};

export const prototypeActivities: BusinessActivity[] = [
  {
    id: 'activity-1',
    title: 'Guia DAS de julho paga com sucesso',
    detail: 'Débito automático · há 2 dias',
    amountCents: 76000,
    tone: 'positive',
  },
  {
    id: 'activity-2',
    title: 'Nota fiscal emitida para Marina Duarte',
    detail: 'Instalação elétrica · há 12 min',
    amountCents: 420000,
    tone: 'positive',
  },
  {
    id: 'activity-3',
    title: 'Uma cobrança vence amanhã',
    detail: 'Fornecedor Central · 09:00',
    amountCents: 128000,
    tone: 'attention',
  },
  {
    id: 'activity-4',
    title: 'Pagamento recebido de Diego Ramos',
    detail: 'Manutenção preventiva · ontem',
    amountCents: 185000,
    tone: 'positive',
  },
];

export const prototypeCashflow: CashflowPoint[] = [
  { label: 'Sem 1', valueCents: 620000 },
  { label: 'Sem 2', valueCents: 810000 },
  { label: 'Sem 3', valueCents: 760000 },
  { label: 'Sem 4', valueCents: 980000 },
  { label: 'Sem 5', valueCents: 1120000 },
];

export function formatPrototypeMoney(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(cents / 100);
}
