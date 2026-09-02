# Relacionamento e retorno

## Escopo

A Fase 7 consolida, sem duplicar, o histórico existente de clientes,
orçamentos, ordens de serviço e recebimentos. Ela adiciona somente configuração
de prazo, marcações internas e uma nota por ordem que já possua ao menos um
evento de conclusão.

## Regras

- O prazo de retorno é configurável por negócio e começa em 90 dias.
- Clientes sem atendimento concluído não entram na lista de retomada.
- A última conclusão vem de `service_order_events`, inclusive após reabertura.
- `Recorrente` e `Prioritário` são marcações independentes.
- A nota aceita satisfação de 1 a 5, observação, ou ambos; há uma por ordem.
- Recebido é a soma histórica de recebimentos menos estornos do cliente.
- As três mensagens são sugestões editáveis. Copiar ou abrir o WhatsApp exige
  ação do proprietário; o aplicativo nunca envia automaticamente.
- Margem, despesas e inadimplência continuam em seus contextos próprios.

## Intervalo individual (Fase 8)

- Cada cliente pode usar 30, 60, 90, 180 ou 365 dias como intervalo esperado.
- Sem valor individual, o cliente usa o prazo global do negócio.
- A retomada acontece quando os dias civis em `America/Sao_Paulo` desde a
  conclusão mais recente são maiores ou iguais ao prazo efetivo.
- O intervalo é manual: nenhum histórico, estatística ou serviço externo o calcula.

## Validação manual

1. Aplicar `202608310018_client_relationships.sql`.
2. Concluir uma ordem e alterar o prazo para que o cliente apareça em
   **Clientes para retomar**.
3. Confirmar que clientes sem conclusão não aparecem.
4. Marcar o cliente como recorrente e prioritário e reabrir seus detalhes.
5. Registrar e editar uma nota com satisfação e observação.
6. Reabrir a ordem e confirmar que a conclusão anterior continua no histórico.
7. Escolher cada modelo, editar o texto, copiar e abrir o WhatsApp.
8. Confirmar que nenhum envio acontece sem ação no WhatsApp.
9. Em um cliente sem intervalo individual, confirmar que a ficha indica o
   padrão do negócio e que a lista usa esse prazo.
10. Definir 30 dias, confirmar a entrada exatamente no 30º dia civil e depois
    trocar o intervalo para verificar a atualização imediata da lista.
