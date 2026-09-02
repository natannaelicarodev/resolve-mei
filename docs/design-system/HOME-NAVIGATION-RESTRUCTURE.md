# Reestruturação da Home e navegação

## Estrutura aprovada

- Navegação principal: Home, Agenda, criação rápida, Clientes e Perfil.
- O menu de criação continua oferecendo novo orçamento, cliente e serviço.
- A grade da Home contém apenas Orçamentos, Serviços e Despesas.
- A Home não consulta nem apresenta totais financeiros.
- Resultado mensal permanece em Despesas > Resultado.

## Tema

A Home deriva superfícies, textos, estados e contrastes do tema ativo. A cor
azul da Direção B possui variantes clara e escura. A navegação inferior usa
o mesmo fundo da tela, e o blur da criação rápida acompanha o tema resolvido.
As cores de fallback das ilustrações também são derivadas desses tokens.

## Validação manual

1. Alternar entre tema claro e escuro na Home e confirmar que não existe uma
   faixa de cor divergente atrás da navegação.
2. Abrir Home, Agenda, Clientes e Perfil e confirmar o estado selecionado.
3. Abrir a criação rápida nos dois temas e conferir blur, superfícies e textos.
4. Confirmar que a Home não mostra A receber nem Resultado do mês.
5. Abrir Despesas e depois Resultado para validar o novo caminho financeiro.
6. Confirmar que a grade mostra somente Orçamentos, Serviços e Despesas.
