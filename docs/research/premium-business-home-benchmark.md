# Benchmark de Home premium para gestão de negócios

Pesquisa baseada exclusivamente em documentação oficial dos produtos. O objetivo não é copiar telas, mas identificar decisões de hierarquia e interação aplicáveis à Home mobile do ResolveMEI.

## Padrões observados

### Shopify: resumo, urgências e recomendações adaptativas

A Home organiza resumo de métricas, tarefas de pedidos abertas ou urgentes e um feed adaptativo de atividade, insights e próximos passos. No mobile, o usuário navega entre métricas por gesto, expande o gráfico e descarta cards dispensáveis. Cada pessoa pode escolher quatro métricas sem alterar a experiência dos outros usuários.

**Leitura para o ResolveMEI:** a Home deve reagir ao contexto e ao papel do usuário. Movimento serve para navegar, revelar detalhes ou remover ruído; não para decorar.

Fonte: [Shopify Help Center — Shopify Home](https://help.shopify.com/en/manual/shopify-admin/shopify-home) e [widgets mobile](https://help.shopify.com/en/manual/shopify-admin/shopify-app/using-shopify-mobile-widgets).

### Square: visão rápida, presença humana e personalização real

O Dashboard mobile filtra uma ou várias unidades, permite escolher até quatro ferramentas para a navegação inferior e oferece widgets configuráveis por métrica e período. O bloco **Who's working** mostra nomes, funções, horários e estados como trabalhando, em pausa, agendado ou com alerta.

**Leitura para o ResolveMEI:** pessoas, clientes e estados vivos quebram a aparência de painel financeiro abstrato. Personalizar significa mudar o que aparece primeiro, não apenas trocar cor ou tema.

Fonte: [Square Support — customize the Dashboard app](https://squareup.com/help/us/en/article/5618-get-started-with-the-square-dashboard-app) e [Square Dashboard](https://squareup.com/us/en/point-of-sale/features/dashboard).

### Ramp: a Home como fila editorial do trabalho

A arquitetura oficial apresenta três camadas: tarefas que pedem atenção, ações rápidas e atividade recente. Os fluxos mobile privilegiam concluir pendências no contexto, como anexar recibo, preencher dados e pedir reembolso.

**Leitura para o ResolveMEI:** a Home deve ordenar o trabalho real por relevância, evitando uma grade em que todos os cards têm o mesmo peso.

Fontes: [Ramp Help Center — getting started as a user](https://support.ramp.com/getting-started-as-a-user) e [Ramp mobile app](https://ramp.com/mobile-app).

### Mercury: atividade como narrativa acionável

No mobile, o detalhe de cobrança combina ações principais com uma linha do tempo de eventos. A partir da lista, é possível lembrar o cliente, copiar o link, marcar como pago ou cancelar. Em transações, filtros atualizam gráficos e agrupamentos; visões filtradas podem ser salvas. O Mercury Command também parte de perguntas orientadas a intenção, como resumir o que precisa de atenção ou preparar um pagamento, sempre com confirmação.

**Leitura para o ResolveMEI:** a atividade deve usar sujeitos e verbos — “Marina pagou”, “lembrete enviado” — e oferecer a próxima ação. Transições devem mostrar causalidade, por exemplo, o filtro alterando imediatamente o gráfico.

Fontes: [Mercury Support — Invoicing dashboard](https://support.mercury.com/hc/en-us/articles/29647851492884-Navigating-your-Mercury-Invoicing-dashboard), [Mercury Support — cashflow and transactions](https://support.mercury.com/hc/en-us/articles/38790547830036-Viewing-cashflow-and-transactions-data-on-your-Transactions-page) e [Mercury — Introducing Command](https://mercury.com/blog/introducing-mercury-command).

### QuickBooks: saúde financeira seguida do que fazer hoje

O Dashboard mobile destaca a posição de caixa e, abaixo, um feed **What needs attention today**, com faturas vencidas, transações para revisar e contas futuras. Outros cards resumem lucro e prejuízo, saldos, faturas e despesas; os valores permitem aprofundar até as transações. A experiência **Get Things Done** mostra a contagem de itens que exigem ação e CTAs específicos.

**Leitura para o ResolveMEI:** uma leitura financeira dominante deve responder “como estou?”; a seção seguinte deve responder “o que faço agora?”. Gráficos precisam levar ao detalhe que explica o número.

Fontes: [Intuit — getting started with the QuickBooks mobile app](https://quickbooks.intuit.com/learn-support/en-uk/help-article/mobile-apps/overview-mobile-app/L0ugRiO57_GB_en_GB), [Intuit — business dashboard details](https://quickbooks.intuit.com/learn-support/en-us/help-article/product-setup/business-dashboard-details-quickbooks-online-app/L46DORrt9_US_en_US) e [Intuit — Get Things Done](https://quickbooks.intuit.com/learn-support/en-us/help-article/manage-workflows/use-things-done-experience-quickbooks-online/L2DTB3sTA_US_en_US).

### Conta Azul: hoje, atrasos e criação rápida

A tela inicial do app apresenta o saldo total, valores a receber e a pagar no dia, itens em atraso, orçamentos e vendas e um gráfico de 12 meses. Um único atalho de adição abre criação de orçamento, venda, cliente, produto, serviço, receita ou despesa; os valores podem ser ocultados. A seleção de outra empresa devolve o usuário ao contexto correspondente da Home.

**Leitura para o ResolveMEI:** para o MEI brasileiro, “hoje” e “em atraso” são recortes mais acionáveis que um panorama genérico. Uma entrada de criação consistente pode concentrar várias ações sem poluir a Home.

Fontes: [Conta Azul — Tela inicial no app](https://ajuda.contaazul.com/hc/pt-br/articles/9883828247309-Conta-Azul-de-Bolso-como-funciona-a-Tela-inicial-no-app) e [Conta Azul — acesso a multiempresas](https://ajuda.contaazul.com/hc/pt-br/articles/31876681203213).

## Direção recomendada para o mock

1. Abrir com **o que precisa de atenção agora**, sem saudação ou slogan ocupando o espaço mais valioso.
2. Usar **uma métrica protagonista**, com período e comparação compreensíveis, seguida de aprofundamento; evitar mosaico de KPIs.
3. Exibir um **feed cronológico humano**, com nomes, status, tempo e verbos, e não uma lista de categorias abstratas.
4. Tornar a **ação principal contextual**: cobrar um cliente, revisar um recebimento ou pagar uma obrigação conforme a pendência dominante.
5. Permitir que o dono escolha métricas e atalhos prioritários; personalização precisa afetar hierarquia.
6. Reservar motion para swipe, expansão, transição de estado e atualização causal de dados.
7. Criar ritmo editorial com blocos de tamanhos e densidades diferentes; evitar grade uniforme de cards arredondados, gradientes decorativos e iconografia sem função.

## Estrutura-base sugerida

`Pendência prioritária → Saúde financeira → Atividade recente → Próximos vencimentos → Ações secundárias`

Essa estrutura é uma inferência de design a partir dos padrões documentados acima, não uma reprodução literal de nenhum produto.
