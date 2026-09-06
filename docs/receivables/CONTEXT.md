# Recebimentos — Fase 4

O Tavi registra manualmente dinheiro que entrou ou foi devolvido fora do
aplicativo. Não existe gateway, cobrança, Pix automático, cartão processado no
app ou confirmação enviada ao cliente.

## Livro-razão e precisão

`quote_financial_entries` é um livro-razão imutável. Cada linha é um
`receipt` ou `refund`; papéis autenticados recebem somente `select`, enquanto as
inserções acontecem por RPCs `security definer` que validam o proprietário. Não
há edição ou exclusão de lançamento. Um erro é corrigido com estorno e, quando
necessário, um novo recebimento.

Valores permanecem `bigint` em centavos no PostgreSQL. Parâmetros e respostas
financeiras atravessam a API como texto decimal e são convertidos para `BigInt`
no domínio do aplicativo. Assim, nenhum saldo passa por `Number` antes de ser
formatado.

O saldo nunca é persistido:

`total do orçamento − recebimentos + estornos`

Quitação é o resultado `saldo = 0`, não um status editável. A RPC bloqueia a
linha do orçamento durante cada lançamento, impedindo que gravações concorrentes
ultrapassem o saldo. Recebimentos exigem orçamento aprovado. Estornos exigem
motivo e não podem superar nem o recebido líquido nem o recebimento original
quando houver referência.

## Datas e formas

A data civil informa quando o dinheiro realmente entrou ou saiu. Hoje e passado
são aceitos; futuro é bloqueado no backend usando `America/Sao_Paulo`. A lista
fechada para entrada e devolução é dinheiro, Pix, cartão de débito, cartão de
crédito, transferência e outro.

O vencimento informativo vive em `quote_receivable_settings`, separado do
orçamento e dos lançamentos. Ele não dispara cobrança, notificação, juros,
multa, status ou bloqueio.

## Integrações

- Orçamento aprovado: resumo completo, vencimento, lançamentos, recebimento e
  estorno.
- Ordem de serviço: saldo do orçamento somente para leitura.
- Home: um único indicador agregado **A receber**.
- Portal público: nenhuma informação financeira.
- Cliente: resumo agregado adiado, pois seria uma integração opcional com custo
  estrutural sem benefício para a integridade do livro-razão.

Parcelas planejadas também foram adiadas integralmente. Recebimentos parciais
continuam livres e não dependem de plano prévio.

## Verificação manual

1. Abra um orçamento não aprovado e confirme que não há ações financeiras.
2. Em um aprovado, defina e remova um vencimento informativo.
3. Registre recebimento parcial com data passada e confira o saldo.
4. Registre outro recebimento e tente ultrapassar o saldo; a ação deve bloquear.
5. Registre estorno com motivo, primeiro solto e depois referenciado.
6. Tente estornar acima do recebido líquido e acima do original.
7. Registre o valor restante e confirme **Quitado** apenas em saldo zero.
8. Confira o saldo somente leitura na ordem e o agregado na Home.
9. Troque A → B → A e confirme isolamento e limpeza do cache privado.
