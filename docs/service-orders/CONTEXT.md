# Execução do serviço — Fase 3

Este domínio transforma um orçamento aprovado em uma execução operacional. A
ausência de uma linha em `service_orders` representa **sem ordem**. A criação é
sempre explícita e registra o estado `pending`, sem preencher `started_at`; a
aprovação do orçamento, inclusive pelo link público da Fase 2, nunca cria uma
ordem sozinha. O início da execução é uma segunda ação explícita.

## Regras persistidas

- Somente o proprietário do negócio pode consultar ou executar as RPCs.
- O backend exige `quotes.status = 'approved'` para iniciar.
- Uma tentativa cancelada pode ser substituída. Uma ordem pendente, em
  andamento, pausada ou concluída impede outra ordem para o mesmo orçamento.
- Transições aceitas: pendente → em execução/cancelado; em execução →
  pausado/concluído/cancelado; pausado → em execução/concluído/cancelado; e
  concluído → em execução por **Reabrir ordem**. Cancelado é terminal.
- Reabertura exige confirmação e motivo. O evento de conclusão anterior
  permanece imutável e um evento `reopened` marca o novo ciclo.
- Cada alteração recebe o estado esperado pelo cliente. Se outro dispositivo
  já mudou a ordem, a RPC responde `SERVICE_ORDER_STALE` sem sobrescrever.
- Cancelar exige motivo. Pausar pode não ter motivo.
- Eventos não têm permissão de inserção, edição ou exclusão para o cliente;
  somente as RPCs `security definer` gravam o histórico com `auth.uid()`.
- O status do orçamento aprovado não é alterado pela execução.

## Interface e cache

A tela do orçamento consulta a ordem mais recente. Sem ordem, mostra **Criar
ordem de serviço**; com ordem, mostra seu estado e o acesso à execução. A tela de
execução recarrega os itens do orçamento somente para leitura, apresenta o
histórico cronológico e libera observações e controles apenas em estados
ativos. As chaves do TanStack Query incluem usuário e negócio, e a troca de
sessão continua limpando todo o cache privado no `AuthProvider`.

## Pendência prioritária — evidência fotográfica

Evidências fotográficas não fazem parte desta entrega. Os buckets existentes
são privados e semanticamente exclusivos para avatar e logotipo; reaproveitá-los
misturaria políticas e ciclos de vida. A Fase 3 registra observações textuais de
até 2.000 caracteres sem instalar permissões ou criar um pipeline de mídia.

Esta pendência não deve ser tratada como uma melhoria cosmética. Evidência de
antes, durante e depois é um diferencial central em aplicativos do nicho e
reduz disputas entre prestador e cliente sobre o que foi executado. Deve ser
priorizada antes da Fase 7, idealmente entre as Fases 4 e 5, com bucket privado
próprio, políticas por negócio e ordem, limites de tipo/tamanho, URLs assinadas,
remoção segura e testes de isolamento.

## Verificação manual

1. Em um orçamento aprovado sem ordem, toque em **Criar ordem de serviço**.
2. Confirme o estado aguardando início e `started_at` vazio; depois toque em
   **Iniciar execução** e confira os dois eventos e o horário real de início.
3. Adicione uma observação, pause, retome e conclua. Reabra com motivo e
   confirme que a conclusão anterior continua na linha do tempo.
4. Em outra ordem, cancele: motivo vazio deve ser bloqueado e o motivo válido
   deve aparecer no histórico.
5. Confirme que concluída/cancelada não oferece ações nem observações.
6. Após cancelamento, volte ao orçamento e inicie uma nova tentativa.
7. Após conclusão, confirme que o orçamento apenas abre a ordem concluída.
8. Com contas A e B, valide que B não lê nem altera a ordem de A; ao retornar a
   A, nenhuma informação de B deve permanecer em cache.
