# Baseline estrutural de navegação do app

## Status

Aceito como limitação conhecida para o beta em 5 de setembro de 2026. Esta
decisão encerra a frente aberta de investigação de performance; ela não é uma
regressão nem uma autorização para continuar removendo seções funcionais.

## Evidência

A Agenda e Serviços foram medidos no Samsung A15 com APK release/profileable,
sessão e massa de dados originais, MacroDroid interrompido e processo novo em
cada amostra. Cada direção teve três capturas Perfetto.

Na Agenda, depois de achatar as células do calendário, Home→Agenda permaneceu
em 54,89–58,10 ms no maior `doFrame` por rodada e 42,56–47,04 ms em
`Record View#draw()`. O isolamento diagnóstico posterior da lista chegou a
44,11–50,52 ms de `doFrame`, mas não foi mantido porque removia conteúdo
essencial. Portanto, o baseline do produto é o intervalo com a lista presente,
não o resultado da variante diagnóstica.

Serviços foi escolhida como controle porque usa a mesma navegação inferior, mas
substitui o calendário por busca, filtros e `FlatList`. Os traces estão em
`artifacts/perfetto/services-basic/`.

| Direção       | Rodada | Maior `doFrame` | Maior `traversal` | Maior `Record View#draw()` |
| ------------- | -----: | --------------: | ----------------: | -------------------------: |
| Home→Serviços |      1 |        82,80 ms |          75,27 ms |                   66,89 ms |
| Home→Serviços |      2 |        76,01 ms |          70,83 ms |                   64,34 ms |
| Home→Serviços |      3 |        81,96 ms |          73,77 ms |                   66,36 ms |
| Serviços→Home |      1 |       158,57 ms |         119,36 ms |                   67,53 ms |
| Serviços→Home |      2 |       153,73 ms |         114,80 ms |                   67,51 ms |
| Serviços→Home |      3 |       151,59 ms |         109,64 ms |                   71,25 ms |

Nos piores frames Home→Serviços, a main thread ficou efetivamente executando por
69,48–75,19 ms. Ela passou somente 0,47–1,02 ms pronta aguardando CPU e
5,43–7,28 ms bloqueada. Nenhum GC coincidiu com esses frames. Os máximos da
RenderThread ficaram em 15,43–22,19 ms, as esperas de GPU em 10,76–12,43 ms e a
composição do SurfaceFlinger em 11,34–14,47 ms; esses valores não acompanham a
magnitude de 76–83 ms da main thread.

## Decisão

Serviços confirma a mesma classe de hotspot encontrada na Agenda: trabalho de
`traversal` e gravação do desenho da árvore nativa domina a main thread. A volta
para a Home amplia o mesmo padrão pela reconstrução de uma árvore maior; não
apareceu uma causa alternativa em GPU, SurfaceFlinger, GC ou espera de
scheduling.

Assim, para o beta, esse custo é tratado como limitação estrutural da arquitetura
de navegação/renderização atual do app. Orçamentos, Despesas e Resultado não
recebem números presumidos: a evidência permite compartilhar a classificação do
risco, não afirmar que todas têm a mesma magnitude. Uma tela só deve reabrir uma
investigação própria se apresentar regressão mensurável, travamento ou assinatura
diferente em uso real.
