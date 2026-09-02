# Agenda e ações do dia — Fase 5

## Auditoria

Não havia tabela de agenda nem data informal usada como fonte de agendamento.
O antigo `home/pipeline.ts` mencionava `appointments` apenas como projeção de
produto; ele foi conciliado para apontar às fontes reais e continua sem decidir
estado. As ordens da Fase 3 e o livro-razão/vencimento da Fase 4 estavam
validados antes desta implementação.

## Modelo e regras

`service_appointments` preserva cada visita. Data civil é obrigatória, hora é
opcional e ambas são independentes de fuso; o conceito de “hoje” no backend usa
`America/Sao_Paulo`. Criação e remarcação aceitam apenas hoje ou futuro e apenas
ordens `pending`, `in_progress` ou `paused`.

Um índice único parcial permite no máximo uma linha `scheduled` por ordem. A
remarcação ocorre em uma única RPC: encerra a linha anterior como `rescheduled`
e cria outra `scheduled`, ligada por `rescheduled_from_id`. Realização e
cancelamento encerram somente a visita; nenhuma operação de agenda altera a
ordem ou o orçamento.

Papéis autenticados têm apenas `select`. Toda escrita passa por RPC
`security definer`, valida proprietário e bloqueia as linhas relevantes. O
cache usa chaves privadas com usuário e negócio e é apagado nas trocas de
sessão.

## Atraso e ações do dia

Não existe coluna `overdue`. `get_agenda_overview` deriva atraso quando uma
visita continua `scheduled` e `scheduled_on < hoje`. A mesma RPC retorna todas
as visitas ativas e vencimentos de hoje cujo saldo derivado ainda é positivo.
Agenda, Ações do dia e o contador da Home partem dessa consulta única.
Alterações de vencimento, recebimento e estorno invalidam também essa consulta,
para que o indicador não dependa de reiniciar ou remontar a Home.

## Integrações e limites

- Ordem: criação, remarcação, realização, cancelamento e histórico discreto.
- Agenda: atrasadas, hoje, vencimentos financeiros e próximas visitas por dia.
- Home: um indicador navegável “Ações de hoje”.
- Orçamento: nenhuma coluna ou seção duplicada.
- Recebimentos: somente leitura do vencimento e saldo.
- Cliente e portal público: sem visibilidade de agenda.

Continuam fora do escopo recorrência, equipe, calendários externos,
notificações, rotas, geolocalização e calendário visual complexo.

## Roteiro manual

1. Crie uma ordem aprovada e confirme que ela está aguardando início.
2. Agende uma visita para hoje e abra **Agenda** pela Home.
3. Confirme a visita em **Ações do dia** e toque para voltar à ordem.
4. Remarque para amanhã e confira a linha antiga como **Visita remarcada**.
5. Marque a nova visita como realizada e confirme que o estado da ordem não mudou.
6. Crie outra visita e cancele; ordem e orçamento devem permanecer iguais.
7. Tente data passada, ordem concluída e segunda visita ativa.
8. Com uma visita que passou sem ação, confirme o destaque **Atrasada**.
9. Defina vencimento de hoje com saldo aberto; depois quite e confira a remoção.
10. Troque A → B → A e confirme isolamento e limpeza do cache privado.
