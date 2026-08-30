# Benchmark de Home mobile para Service Business Management

Atualizado em 29 de agosto de 2026.

## Objetivo e método

Este benchmark orienta a Home mobile-first de um SaaS de gestão para microempreendedores e prestadores de serviços. A pergunta central não é “quanto entrou?”, mas “o que precisa acontecer agora para transformar uma solicitação em serviço concluído e recebido?”.

Foram consultadas somente páginas, centrais de ajuda e documentação dos próprios produtos. Quando uma conclusão de design não é declarada literalmente pela fonte, ela está identificada como **inferência de produto**. Não se pretende copiar a identidade visual ou uma tela específica; as referências servem para compreender hierarquia operacional, modelo mental e padrões de interação.

## Síntese executiva

A Home deste nicho deve ser um **centro de comando do trabalho**, não um dashboard financeiro. A primeira viewport precisa responder, nesta ordem:

1. Qual é o próximo atendimento e quando ele começa?
2. O que devo fazer agora — confirmar, sair, iniciar, concluir, enviar orçamento ou cobrar?
3. Como está o restante do meu dia?
4. Há novas solicitações, mensagens ou orçamentos sem resposta que podem virar trabalho?

O dinheiro aparece ligado ao fluxo do serviço: sinal pendente, orçamento aguardando aprovação, serviço concluído ainda não faturado, cobrança daquele cliente ou fechamento do atendimento. Saldo, faturamento mensal e gráficos são contexto secundário, não o protagonista.

**Direção recomendada para a primeira viewport:** cabeçalho contextual curto; cartão operacional do próximo compromisso com cliente, serviço, horário, local/status e uma CTA coerente com a etapa; trilho compacto dos demais compromissos de hoje; fila pequena de pendências comerciais/operacionais. O botão global de criação deve criar algo próprio do domínio — agendamento, cliente, orçamento ou serviço — e não competir com a ação do atendimento atual.

## O que diferencia Service Business Management de fintech

| Dashboard financeiro genérico | Home de gestão de serviços |
| --- | --- |
| Unidade central: dinheiro e período | Unidade central: cliente + serviço + compromisso/trabalho |
| Pergunta principal: “quanto entrou/saiu?” | Pergunta principal: “quem atendo agora e o que falta fazer?” |
| Gráficos, saldo e variação ocupam a abertura | Agenda do dia e próximo trabalho ocupam a abertura |
| CTA típica: cobrar, transferir, adicionar transação | CTA muda com o estado: confirmar, navegar, iniciar, concluir, orçar, faturar |
| Transações são o feed natural | Visitas, mensagens, aprovações e mudanças de status formam a atividade |
| Segmentação por conta/categoria | Segmentação por profissional, serviço, cliente, local e etapa do trabalho |
| Sucesso: conciliação e fluxo de caixa | Sucesso: agenda ocupada, serviço bem executado, cliente informado e ciclo fechado |

Essa distinção é sustentada pelos fluxos oficiais: Jobber organiza o trabalho entre solicitação, orçamento, job, visita, conclusão, fatura e pagamento; Housecall Pro une jobs, agenda, detalhes do cliente, estimativas e cobrança; ServiceM8 trabalha com job cards, despacho, check-in/out, materiais e faturamento no local; Square Appointments, Fresha e Trinks partem do calendário, serviço, cliente e profissional. Fontes: [Jobber — app de field service](https://www.getjobber.com/features/field-service-management-app/), [Housecall Pro — mobile app](https://www.housecallpro.com/features/mobile-app/), [ServiceM8 — introdução](https://www.servicem8.com/us/introduction), [Square — criar e agendar appointments](https://squareup.com/help/us/en/article/5349-create-and-schedule-appointments), [Fresha — scheduling](https://www.fresha.com/for-business/features/scheduling), [Trinks — agenda no aplicativo profissional](https://ajuda.trinks.com/agenda-e-agendamentos-atraves-do-aplicativo-trinks-profissional).

## Leituras por produto

### Jobber

É a referência mais direta para uma Home operacional de serviços externos. A página oficial do aplicativo mostra a Home com **requests, quotes e visits do dia** e afirma que, “de relance”, o usuário acompanha cada etapa do workflow, o progresso dos compromissos e as ações necessárias. Notificações cobrem alteração de agenda, nova solicitação, mensagem do cliente e visualização de orçamento. A agenda permite decidir em campo, ver visitas diárias no mapa e atribuir por localização. No atendimento, detalhes, formulários, fotos e tempo trabalhado acompanham a execução; ao concluir o job, uma fatura é gerada e fica pronta para envio. [Fonte oficial do Jobber](https://www.getjobber.com/features/field-service-management-app/).

A documentação atual da Home mobile detalha uma hierarquia ainda mais útil: mapa e `Up next`, receita do dia, `To-do`, saúde do negócio, descoberta e activity feed. O `To-do` reúne pedidos novos, avaliações concluídas, alterações pedidas em quotes, jobs que precisam ser faturados e invoices pendentes/vencidas; itens urgentes sobem. O activity feed registra ações reais de equipe e clientes, como clock-in/out, criação/envio/conversão, visita concluída, pagamento, notas e fotos. [Home no aplicativo Jobber](https://help.getjobber.com/en/articles/home-in-the-jobber-app/). A versão web também declara priorizar aspectos urgentes e sensíveis ao tempo. [Home do Jobber](https://help.getjobber.com/en/articles/home/).

A documentação formaliza a semântica: **job** é o escopo geral e **visit** é cada evento do calendário no local do cliente. A agenda mobile oferece dia, semana e lista, ordena cartões por horário e inclui visitas, solicitações, tarefas e eventos. [Jobs no app](https://help.getjobber.com/en/articles/jobs-in-the-jobber-app/) e [agenda no app](https://help.getjobber.com/en/articles/schedule-in-the-jobber-app/).

Implicações para a Home:

- primeira viewport orientada ao dia e à próxima visita;
- status legível como progresso do trabalho, não como KPI abstrato;
- pendências comerciais perto da agenda: nova solicitação e orçamento visto/aguardando resposta;
- comunicação humana como evento relevante;
- CTA do cartão muda conforme a etapa do atendimento;
- conclusão conecta execução a faturamento sem transformar a tela numa fintech.

### Housecall Pro

O aplicativo oficial posiciona juntos jobs, schedules e payments, mas o “Jobs Dashboard” dá prioridade a detalhes do job, agenda, histórico do cliente e atualizações em tempo real. O profissional consegue consultar tudo antes do compromisso, registrar ponto, produzir orçamento e cobrar no local; o modo offline mantém agenda e dados essenciais acessíveis em campo. [Fonte oficial do app](https://www.housecallpro.com/features/mobile-app/).

Na criação mobile, a CTA `+` fica no canto superior do dashboard e abre “New Job”; o fluxo inclui horário, recorrência, janela de chegada, equipe atribuída e notificação ao cliente. A plataforma também mantém pipeline para converter leads e estimates em jobs. [Agendamento oficial](https://help.housecallpro.com/en/articles/6758788-scheduling-jobs-and-estimates) e [visão de funcionalidades](https://www.housecallpro.com/features/).

Implicações para a Home:

- CTA global de criação é útil, mas deve abrir entidades do domínio;
- cartão do serviço deve antecipar endereço, janela de chegada, responsável e histórico/observações essenciais;
- mudanças de agenda e status precisam de visibilidade imediata;
- conexão offline e estado de sincronização são informações funcionais para trabalho externo;
- estimativa, job e invoice devem parecer fases conectadas, não módulos isolados.

### ServiceM8

ServiceM8 é especialmente forte na execução em campo. O job card pode nascer como **Quote** ou **Work Order**; dali o profissional agenda, conversa com o cliente mantendo o histórico no Diary, adiciona materiais e mão de obra durante o serviço, faz checkout e gera orçamento ou fatura ainda no local. [Guia oficial do aplicativo](https://support.servicem8.com/help-center/app/basics/new-to-the-servicem8-app-start-here).

No desktop, o Dispatch Board é descrito oficialmente como hub central onde o negócio passa a maior parte do tempo. Ele combina criação, agenda/alocação, orçamento/fatura, SMS/e-mail, mapa e lista. Além dos estados `Quote`, `Work Order`, `Completed` e `Unsuccessful`, destaca `Unscheduled` como trabalho que exige ação e usa queues para espera por peças, evento, fabricação ou resposta do cliente; indicadores compactos sinalizam não lido, revisão e espera. [Dispatch Board oficial](https://support.servicem8.com/help-center/desktop/basics/dispatch-board-overview).

A plataforma permite criar e agendar jobs, fazer orçamento, faturar e receber pelo iOS; o Dispatch Board é a visão de coordenação. Booking online pode produzir orçamento, selecionar horário e criar/atribuir automaticamente o job, considerando capacidade, agenda e deslocamento. [Introdução oficial](https://www.servicem8.com/us/introduction), [Help Center](https://support.servicem8.com/) e [online booking](https://www.servicem8.com/features-online-booking).

Implicações para a Home:

- serviço em andamento merece um estado dominante e controles de execução;
- check-in, tempo, checklist/formulário, fotos, materiais e checkout pertencem ao contexto do job;
- a Home deve destacar jobs sem agendamento, sem responsável ou esperando ação;
- histórico humano de contato e mudanças pode ser resumido como “diário do trabalho”;
- faturar é o encerramento natural do atendimento, não uma ação financeira desconectada.

### HoneyBook

HoneyBook representa serviços baseados em projeto e relacionamento, não apenas visitas de campo. No mobile, a Home reúne mensagens recentes, snapshot do calendário, novos leads e pipeline de projetos; também permite responder a inquiries, criar projetos, conversar com clientes e receber notificações de pagamento. [Recursos mobile oficiais](https://help.honeybook.com/en/articles/2673568-honeybook-on-mobile-key-features-for-small-business-owners).

Na Home documentada, aparecem novos leads ainda sem resposta, mensagens, atividade recente de projetos, próximos eventos do calendário e atalhos de criação para cliente, projeto, invoice, contrato, meeting e lead form. A visão de pagamentos diferencia pago, processando, próximo e vencido e é restrita por papel. A página declara que a Home pode ser personalizada. [Documentação oficial da homepage](https://help.honeybook.com/en/articles/5339081-about-your-honeybook-homepage).

Implicações para a Home:

- “atividade humana” deve mostrar nome, contexto e verbo: cliente respondeu, viu orçamento, confirmou ou enviou mensagem;
- leads sem resposta e projetos parados são pendências de negócio de primeira classe;
- personalização deve respeitar tipo de serviço e papel, não apenas esconder cards;
- informações sensíveis e ações devem obedecer permissões;
- para serviços longos, “próximo marco” pode substituir “próxima visita”.

### Square Appointments

Square parte do calendário: no app, a criação começa por `Calendar` e `+` ou por um horário livre. Um appointment agrega cliente, local, notas, serviço/item, profissional, horário, contrato, notificação e cartão salvo; existe aviso de conflito. Também é possível criar um agendamento dentro de uma conversa. [Documentação oficial de criação](https://squareup.com/help/us/en/article/5349-create-and-schedule-appointments).

A agenda pode ser personalizada por disponibilidade, cor por profissional ou serviço, limite diário e bloqueio de tempo pessoal. Booking online sincroniza automaticamente com calendário e POS e pode exigir sinal ou pré-pagamento. [Planos e recursos oficiais](https://squareup.com/us/en/appointments/pricing) e [configuração de booking](https://squareup.com/help/us/en/article/5355-set-up-online-booking-with-square-appointments).

Implicações para a Home:

- calendário/linha do tempo deve ser visualmente escaneável, com cor funcional e moderada;
- criar atendimento a partir do horário reduz passos e previne conflito;
- cliente, serviço e responsável precisam aparecer juntos;
- mensagens podem virar agendamento sem perder contexto;
- sinal e checkout são propriedades do compromisso, não KPIs da abertura.

### Fresha

Fresha é uma referência forte para profissionais independentes e operações com agenda densa. O produto declara um calendário que funciona em qualquer dispositivo, encontra horários livres e conecta appointment a formulários, pagamento antecipado, recursos, lembretes e checkout. O perfil 360º reúne histórico, preferências, notas, documentos e informações necessárias antes da visita. [Funcionalidades oficiais](https://www.fresha.com/en-GB/for-business/features).

A agenda considera turnos, pausas, tempo extra, notas, equipe, salas/equipamentos, waitlist, depósitos e no-show. O checkout encerra o appointment sem interromper o fluxo de atendimento. [Scheduling oficial](https://www.fresha.com/for-business/features/scheduling).

Implicações para a Home:

- alta densidade funciona quando tempo, duração, profissional e estado têm hierarquia constante;
- gaps e lista de espera são oportunidades operacionais, não estatísticas decorativas;
- preferências e cuidados do cliente devem estar disponíveis no contexto do atendimento;
- recursos e tempo de preparo/intervalo importam em certos segmentos;
- personalização deve adaptar campos e linguagem à categoria de serviço.

### Trinks

Trinks confirma o mesmo modelo no contexto brasileiro de beleza e bem-estar. O app profissional existe como centro de comando para ver próximos compromissos, serviços, programação diária, clientes e fechamento de conta. Há visualizações diária, semanal, mensal e em lista; tocar num horário disponível inicia “Novo agendamento”. [Visão do app profissional](https://ajuda.trinks.com/foco-no-talento-autonomia-e-eficiencia-com-o-app-trinks-profissional) e [agenda mobile](https://ajuda.trinks.com/agenda-e-agendamentos-atraves-do-aplicativo-trinks-profissional).

O app permite personalizar acessos, cadastrar clientes, agendar, fechar conta, consultar contas, ausências, comissões e notificações como confirmação, cliente chegou, cancelamento, aniversário e cliente novo. [Índice oficial do aplicativo](https://ajuda.trinks.com/aplicativo-trinks-profissional) e [guia oficial](https://ajuda.trinks.com/aplicativo-trinks-profissional-central-de-ajuda).

Implicações para a Home:

- localização brasileira pede ações de WhatsApp, sinal, confirmação e fechamento de conta;
- “cliente chegou” e “ausência” são estados humanos/operacionais úteis;
- permissões podem alterar Home e ações por dono, administrador e profissional;
- a identidade premium não deve sacrificar a rapidez de uma agenda com muitos atendimentos.

### Conta Azul

Conta Azul é útil como referência complementar brasileira para orçamento/venda, mas **não deve determinar a hierarquia da Home de serviços**. No aplicativo, o menu Vendas permite registrar, acompanhar e enviar orçamentos, transformá-los em venda e informar recebimento. [Documentação oficial do app](https://ajuda.contaazul.com/hc/pt-br/articles/4407192178189-Conta-Azul-de-Bolso-Vendas-e-Or%C3%A7amentos).

A ordem de serviço distingue `Orçamento pendente` de `Serviço pendente`, e um orçamento aprovado pode gerar venda com cliente, itens e total preenchidos. [OS para orçamento](https://ajuda.contaazul.com/hc/pt-br/articles/39432206843917-Vendas-como-criar-um-or%C3%A7amento-a-partir-de-uma-ordem-de-servi%C3%A7o) e [orçamento para venda](https://ajuda.contaazul.com/hc/pt-br/articles/45345551311885-Or%C3%A7amentos-como-transformar-o-or%C3%A7amento-em-venda).

Implicação: aproveitar a clareza dos estados e da conversão documental, mantendo a agenda e a execução acima do financeiro.

## Padrões transversais por problema de design

### Primeira viewport

**Evidência:** Jobber mostra requests, quotes e visits do dia na Home; HoneyBook traz calendário, leads e mensagens; Housecall Pro chama o dashboard de visão única de atualizações de jobs; Trinks expõe próximos compromissos.  
**Inferência de produto:** a abertura deve privilegiar situação atual + próxima ação, sem hero promocional, saudação enorme, gráfico decorativo ou saldo dominante.

### Agenda de hoje e próximos trabalhos

Mostrar uma sequência temporal curta, distinguindo “agora”, “próximo” e “depois”. Cada item deve conter horário/janela, duração quando relevante, cliente, serviço, local ou modalidade, responsável e status. A visão completa pode oferecer dia/lista/mapa; a Home mostra somente o necessário para operar.

### Clientes

O cliente não é um avatar ornamental. O cartão do trabalho deve abrir contato, endereço/rota, histórico, preferências, notas e documentos pertinentes. Informações sensíveis ou irrelevantes devem ficar em detalhe progressivo.

### Orçamentos aguardando resposta

Orçamento deve aparecer como trabalho comercial em movimento: enviado há quanto tempo, visto ou não, valor/contexto, cliente e próxima ação. Priorizar os que foram visualizados, vencem em breve ou não receberam follow-up. Jobber notifica quando o cliente vê uma quote; HoneyBook destaca lead sem resposta; ServiceM8 automatiza follow-ups.

### Execução do serviço

Ao iniciar, a Home pode mudar de “agenda do dia” para “serviço em andamento”. A ação principal passa a ser concluir a etapa atual. Checklist, formulário, tempo, fotos, materiais, notas e contato ficam agrupados no job, conforme os fluxos de Jobber e ServiceM8.

### Cobrança

Cobrança entra nos momentos certos: sinal para confirmar, checkout ao concluir, fatura pronta após o job e lembrete para atraso. Um resumo financeiro agregado pode existir mais abaixo ou em módulo próprio. O vínculo visual deve ser sempre com cliente/serviço/documento.

### CTA principal

Existem duas camadas:

- **CTA contextual:** no próximo atendimento ou job em andamento; muda entre confirmar, ver rota, iniciar, continuar, concluir, faturar e cobrar.
- **CTA global:** criação rápida de agendamento, cliente, orçamento ou serviço. Pode usar `+`, mas precisa de rótulos claros no menu.

Evitar um botão genérico “Resolver agora” sem objeto e sem consequência previsível.

### Atividade humana

Atividade relevante é uma mudança causada por alguém: “Marina aprovou o orçamento”, “João pediu outro horário”, “Carlos chegou”, “Ana visualizou a proposta”. Usar nome, verbo, objeto, tempo e ação possível. Separar alertas críticos de um feed histórico; não transformar tudo em notificação vermelha.

### Navegação mobile

**Inferência baseada nos fluxos oficiais:** quatro ou cinco destinos persistentes são suficientes: `Início`, `Agenda`, `Trabalhos` (ou `Serviços`), `Clientes` e `Mais`. Orçamentos e cobranças podem viver no fluxo de Trabalhos/Comercial, conforme o escopo. Uma ação de criar pode ser central/flutuante apenas se não reduzir clareza ou acessibilidade.

### Densidade

Premium não significa vazio. Agenda de serviço requer densidade informacional controlada: uma linha temporal compacta, tipografia forte, alinhamentos rigorosos, poucos níveis de superfície e cor reservada para status/ação. Cards gigantes, excesso de bordas arredondadas, chips redundantes e grandes áreas de gradiente reduzem a quantidade de trabalho visível e produzem aparência genérica.

### Personalização

Personalizar por realidade operacional:

- trabalho em campo: rota, janela de chegada, offline, equipe, materiais;
- atendimento com hora marcada: duração, sala/recurso, intervalo, chegada e no-show;
- serviço baseado em projeto: lead, mensagem, próximo marco, contrato e aprovação;
- solo: foco no próximo cliente e criação rápida;
- equipe: responsável, capacidade, conflitos e permissões.

Permitir reordenar ou ocultar seções é secundário. A personalização valiosa muda conteúdo, vocabulário e ação conforme segmento, papel e estado do trabalho.

## Recomendação concreta para o próximo mock

### Primeira viewport (390 × 844 como referência)

1. **Barra superior (compacta):** marca/negócio selecionado, data contextual e notificações; sem headline de marketing.
2. **Próximo atendimento:** horário destacado, cliente, serviço, duração/local, status e uma CTA contextual. Ações secundárias discretas: mensagem e rota/detalhes.
3. **Hoje:** trilho/linha do tempo com 2–4 compromissos e um indicador compacto de espaço livre ou conflito.
4. **Precisa de atenção:** no máximo três pendências priorizadas — novo pedido, orçamento visto sem resposta, serviço concluído sem faturar.

### Continuação da Home

- próximos trabalhos de amanhã/semana;
- atividade humana recente;
- pequeno resumo do ciclo comercial (`novos pedidos → orçamentos → aprovados`);
- financeiro contextual e discreto (`a receber por serviços concluídos`, não “saldo total”);
- atalhos configuráveis, se houver evidência de uso recorrente.

### Linguagem visual

- estrutura editorial e operacional, com fundo neutro e superfícies usadas apenas quando agrupam informação real;
- tipografia precisa, números tabulares para horários e valores, ícones consistentes;
- uma cor de marca e uma paleta semântica com contraste acessível;
- raio, sombra e gradiente contidos; status não depende somente de cor;
- avatares apenas quando ajudam a reconhecer cliente/profissional;
- movimento reservado a mudança de estado, reordenação e confirmação — nunca decoração contínua.

## Critérios de rejeição

O mock deve ser rejeitado se:

- saldo, gráfico ou faturamento dominar a primeira viewport;
- o usuário não identificar o próximo compromisso em menos de dois segundos;
- cliente, serviço e horário não aparecerem juntos;
- a CTA principal não refletir a etapa atual do serviço;
- “atividade” for apenas uma lista genérica de transações;
- grandes cards deixarem visível somente um item operacional;
- a mesma Home servir, sem mudança de conteúdo, para uma carteira digital ou banco;
- a personalização for só cosmética e ignorar segmento, papel e workflow.

## Fontes oficiais principais

- [Jobber — Field Service Management App](https://www.getjobber.com/features/field-service-management-app/)
- [Jobber — Schedule in the App](https://help.getjobber.com/en/articles/schedule-in-the-jobber-app/)
- [Jobber — Jobs in the App](https://help.getjobber.com/en/articles/jobs-in-the-jobber-app/)
- [Housecall Pro — Mobile App](https://www.housecallpro.com/features/mobile-app/)
- [Housecall Pro — Scheduling Jobs and Estimates](https://help.housecallpro.com/en/articles/6758788-scheduling-jobs-and-estimates)
- [ServiceM8 — App Getting Started](https://support.servicem8.com/help-center/app/basics/new-to-the-servicem8-app-start-here)
- [ServiceM8 — Feature Overview](https://www.servicem8.com/us/feature-overview)
- [HoneyBook — Mobile Features](https://help.honeybook.com/en/articles/2673568-honeybook-on-mobile-key-features-for-small-business-owners)
- [HoneyBook — Homepage](https://help.honeybook.com/en/articles/5339081-about-your-honeybook-homepage)
- [Square — Create and Schedule Appointments](https://squareup.com/help/us/en/article/5349-create-and-schedule-appointments)
- [Square — Appointments Features](https://squareup.com/us/en/appointments/pricing)
- [Fresha — Scheduling](https://www.fresha.com/for-business/features/scheduling)
- [Fresha — Features](https://www.fresha.com/en-GB/for-business/features)
- [Trinks — Aplicativo Profissional](https://ajuda.trinks.com/aplicativo-trinks-profissional)
- [Trinks — Agenda no Aplicativo](https://ajuda.trinks.com/agenda-e-agendamentos-atraves-do-aplicativo-trinks-profissional)
- [Conta Azul — Vendas e Orçamentos no App](https://ajuda.contaazul.com/hc/pt-br/articles/4407192178189-Conta-Azul-de-Bolso-Vendas-e-Or%C3%A7amentos)
