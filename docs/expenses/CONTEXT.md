# Despesas e resultado — Fase 6

## Contexto único

`business_expenses` registra gastos internos em centavos, com data do fato,
categoria fechada, descrição, recorrência informativa e vínculo opcional com um
orçamento. A exclusão é lógica e o registro deixa imediatamente os cálculos e a
interface. Edição e exclusão não exigem motivo.

`expense_receipts` reserva até três comprovantes por despesa. O bucket privado
`expense-receipts` aceita somente JPEG de até 3 MB. Câmera e galeria usam o
mesmo utilitário de compressão da evidência de serviço: entrada de até 10 MB,
conversão para JPEG e redução adaptativa antes do upload. Ao excluir, os
metadados são preservados como excluídos e o aplicativo remove o objeto físico.

`get_expense_month` deriva recebimentos líquidos, despesas, resultado e quebra
por categoria para um mês civil em `America/Sao_Paulo`. Recebimentos e estornos
são reconhecidos por `occurred_on`; despesas usam sua própria `occurred_on`.
Nenhum resultado calculado é persistido.

`get_quote_expense_margin` calcula durante toda a vida do orçamento:
recebimentos menos estornos menos despesas ativas vinculadas. A seção do
orçamento só aparece quando existe ao menos uma despesa vinculada.

A marca `recurring` não agenda tarefas nem cria registros. Ela apenas identifica
a despesa e libera o atalho de duplicação, que abre um novo lançamento com a
data local de hoje para confirmação manual.

## Validação manual

1. Criar uma despesa geral e anexar comprovantes por câmera e galeria.
2. Criar uma despesa vinculada e conferir a margem no orçamento.
3. Editar valor, categoria, data, recorrência e vínculo.
4. Desvincular e revincular a outro orçamento.
5. Excluir sem motivo e conferir remoção da lista, resultado e comprovantes.
6. Conferir recebimentos líquidos, despesas e resultado do mês.
7. Navegar a um mês anterior e validar os totais daquele mês.
8. Duplicar uma despesa recorrente e confirmar que a data sugerida é hoje.
