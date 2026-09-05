# Agenda — histórico da investigação de performance

## Objetivo e protocolo

Este ledger preserva os experimentos executados antes do System Trace para que
tentativas revertidas não dependam do histórico de conversa e não sejam repetidas
sem evidência nova.

As medições foram feitas em build release no Samsung A15, com o MacroDroid
interrompido, processo novo por rodada e três rodadas automatizadas por
`scripts/measure-nav.ps1`. A métrica histórica é o `dumpsys gfxinfo`; por isso
seus percentis não devem ser comparados diretamente aos percentis de Frame
Timeline do Perfetto.

O baseline histórico da Agenda era aproximadamente 44 ms de p90 e 81 ms de p95.
Leituras manuais anteriores variaram em até 3× e não são usadas como evidência.

## Experimentos anteriores ao Perfetto

| Ordem | Experimento                                             | Baseline → resultado                                     | Decisão                  | Conclusão                                                                                                                                                                                                                   |
| ----: | ------------------------------------------------------- | -------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|     1 | Headless tabs, primeira tentativa                       | O registro sobrevivente não contém percentis comparáveis | Descartado nessa forma   | Não passou pelo gate funcional: `TabTrigger` fora do `TabList` sem um trigger real quebrou a navegação. O aprendizado mantido foi que a barra precisava viver no shell compartilhado.                                       |
|     2 | Otimização dos assets da Home                           | p90 44 → 42 ms; uploads lentos de bitmap ~15–16 → ~2     | Mantido                  | As imagens de 1.254×1.254 usadas em 32–40 px consumiam cerca de 20 MB decodificados em conjunto. Redimensioná-las corrigiu memória e uploads, mas a diferença de 2 ms no p90 ficou dentro do ruído e não resolveu a Agenda. |
|     3 | Remover springs de entrada (`Enter`)                    | p90 ~42 → 81 ms                                          | Revertido                | Piorou claramente. Os springs ajudavam a preservar a textura durante a composição; removê-los concentrou reanexação/desenho em frames mais caros.                                                                           |
|     4 | Trocar wrappers `Enter`/`HeroArtwork` por `View` comum  | 192 → 183 views; sem melhora mensurável do p90           | Revertido                | Remover nove wrappers animados não atacou o gargalo dominante. Menos views, isoladamente, não produziu ganho fora do ruído.                                                                                                 |
|     5 | Trocar `Tappable` por `Pressable` comum                 | p90 ~42 → 40 ms                                          | Revertido                | A melhora de ~2 ms ficou dentro do ruído e não justificou perder o feedback de pressão de 12 elementos.                                                                                                                     |
|     6 | Desativar a transição do Stack (`animation: 'none'`)    | p90 42 → 34 ms; p95 75 → 93 ms                           | Revertido                | Redistribuiu o custo: melhorou 19% no p90, mas piorou 24% no p95 e aumentou uploads de bitmap. O corte seco concentrou o pior caso, considerado mais perceptível.                                                           |
|     7 | Headless tabs, segunda tentativa, com assets otimizados | 192 → 378 views; 28 exceções residuais; p90 53–61 ms     | Descartado nessa medição | Manter Home e Agenda montadas simultaneamente dobrou a árvore nativa e piorou o p90. Essa tentativa não sustentou a hipótese de que apenas evitar remount resolveria o problema.                                            |

## Resultado que encerrou a fase de eliminação

Nenhuma hipótese barata eliminou o p90 alto. As mudanças neutras ou piores foram
revertidas; somente a correção objetiva dos assets permaneceu. Isso motivou o
profiling real descrito em `docs/performance/agenda-system-trace.md`.

O Perfetto localizou depois um hotspot repetível de Home→Agenda na main thread:
`Choreographer#doFrame` de 72,73–74,64 ms, dominado por `traversal` de
64,34–65,62 ms e `Record View#draw()` de 59,10–60,73 ms. O próximo A/B ficou,
portanto, restrito à concentração mais evidente da árvore da Agenda: as 42
células do calendário.

## A/B orientado pelo Perfetto

| Experimento                                         |                 Árvore nativa | Maior `doFrame`, Home→Agenda | Maior `Record View#draw()`, Home→Agenda | Decisão |
| --------------------------------------------------- | ----------------------------: | ---------------------------: | --------------------------------------: | ------- |
| Fundir wrapper e controle das células do calendário | 246 → 216 views no mês medido | 72,73–74,64 → 54,89–57,55 ms |            59,10–60,73 → 44,29–47,04 ms | Mantido |

A mediana do pior `doFrame` melhorou 22,4%, e a mediana do pior desenho melhorou
23,3%. A implementação preservou o grid de sete colunas, seleção, feedback
háptico, estado pressionado e rótulos de acessibilidade. Como a melhora excedeu
largamente a variação entre as três rodadas, a hipótese foi confirmada. Os dados
por rodada e o protocolo estão em `docs/performance/agenda-system-trace.md`.

## Regra para novos experimentos

Alterar uma única hipótese, repetir as três rodadas por direção e comparar com o
mesmo recorte do Perfetto. Só manter uma mudança que preserve comportamento e
produza melhora maior que a variação entre rodadas. Resultado neutro ou pior é
revertido e registrado aqui.
