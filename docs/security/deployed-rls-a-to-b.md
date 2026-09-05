# Teste implantado de RLS A→B

## Status

Executado em 5 de setembro de 2026 contra o Supabase implantado: **aprovado, sem
vazamento entre contas**.

Foram usados somente usuários dedicados criados por `signUp`, duas sessões
`authenticated` independentes e a chave pública do aplicativo. Não foram usadas
a conta Natannael, contas pessoais, `service_role` ou credenciais
administrativas. A execução foi fail-fast para qualquer leitura ou mutação
cruzada bem-sucedida.

## Massa isolada

A conta A criou um negócio sintético e registros encadeados de cliente,
orçamento aprovado, ordem de serviço, reserva pendente de evidência, recebimento,
despesa, configuração de relacionamento, perfil de relacionamento e intervalo
de retorno. A conta B possuía somente seu próprio negócio sintético.

## Resultado das leituras

| Tentativa da conta B contra A                       | Resultado                       |
| --------------------------------------------------- | ------------------------------- |
| Cliente por ID direto                               | Bloqueada; zero linhas          |
| Orçamento por ID direto                             | Bloqueada; zero linhas          |
| Ordem de serviço por ID direto                      | Bloqueada; zero linhas          |
| Evidência por ID direto                             | Bloqueada; zero linhas          |
| Recebimento por ID direto                           | Bloqueada; zero linhas          |
| Despesa por ID direto                               | Bloqueada; zero linhas          |
| Configuração de relacionamento por chave direta     | Bloqueada; zero linhas          |
| Perfil de relacionamento/intervalo por chave direta | Bloqueada; zero linhas          |
| `get_client_relationship_overview` sobre cliente A  | Bloqueada; `BUSINESS_NOT_OWNED` |
| `get_quote_receivable` sobre orçamento A            | Bloqueada; `BUSINESS_NOT_OWNED` |
| `get_business_expense` sobre despesa A              | Bloqueada; `BUSINESS_NOT_OWNED` |
| `get_reconnect_clients` sobre negócio A             | Bloqueada; `BUSINESS_NOT_OWNED` |

O overview de relacionamento é uma RPC `SECURITY DEFINER` que agrega cliente,
orçamentos, ordens e recebimentos; assim, esses caminhos foram exercitados por
RPC além da leitura direta. Evidências não possuem RPC de leitura: o aplicativo
as lê diretamente da tabela. A RPC de exclusão de evidência foi testada como
caminho privilegiado de escrita.

Uma chamada adicional a `get_home_dashboard` não entrou no resultado porque o
harness informou `p_timezone`, mas a função implantada recebe `p_period`. O
PostgREST rejeitou a assinatura antes de executar autorização; classificá-la
como bloqueio de RLS seria incorreto.

### Follow-up do harness — encerrado

A incompatibilidade foi investigada separadamente. As migrations implantadas, o
tipo gerado em `src/types/database.ts` e a chamada usada pelo aplicativo
concordam em `p_period`; não existe divergência entre código e banco. O erro ficou
restrito ao harness temporário, que foi removido depois da execução. Qualquer
nova bateria deve usar `p_business_id` e `p_period` ao chamar
`get_home_dashboard`.

## Resultado das escritas

Para cliente, orçamento, ordem, evidência, recebimento e despesa, a conta B
tentou `UPDATE` e `DELETE` diretos. O cliente retornou zero linhas no `UPDATE` e
o registro A permaneceu inalterado. As demais operações foram negadas por grants
ou retornaram zero linhas; depois de cada tentativa, a sessão A confirmou que o
registro ainda existia e não havia mudado.

As seguintes RPCs `SECURITY DEFINER` também rejeitaram a conta B com
`BUSINESS_NOT_OWNED`:

- edição de orçamento;
- transição de ordem de serviço;
- exclusão de evidência;
- criação de recebimento;
- edição e exclusão de despesa;
- alteração da configuração de relacionamento;
- alteração do perfil de relacionamento;
- alteração do intervalo individual de retorno.

Total: **37 tentativas conclusivas bloqueadas e zero vazamentos**.

## Resíduos controlados

O fluxo público não permite excluir usuários de `auth.users`; isso exigiria uma
credencial administrativa, deliberadamente fora do teste. Ficaram seis contas
sintéticas identificáveis pelos prefixos `tavi.rls.*` e `tavi.rls.live.*`:

- duas do diagnóstico inicial de conectividade, somente com o perfil criado pelo
  trigger;
- duas de uma preparação abortada por validação do e-mail do negócio, também sem
  massa funcional;
- o par A/B aprovado, com a massa sintética descrita acima.

Esses usuários e dados não contêm informação pessoal ou dados da conta original.
A remoção futura deve ser feita pelo painel/admin do Supabase, sem introduzir
`service_role` no aplicativo ou no harness público.
