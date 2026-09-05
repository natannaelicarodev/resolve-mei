# Agenda — System Trace

## Estado

A bateria Home↔Agenda foi executada em 5 de setembro de 2026. O ambiente foi
preparado com Android Studio, SDK/ADB, JDK 17 e Trace Processor v58.2. O Samsung
SM-A155M foi autorizado via ADB e recebeu com sucesso o APK release/profileable,
preservando os dados existentes (a assinatura do APK coincidiu com a instalada).

Uma captura curta, sem navegação, validou o pipeline antes da bateria: o Perfetto
do aparelho gerou um trace de 825.519 bytes e o Trace Processor encontrou a main
thread do app, a thread JS, SurfaceFlinger, RenderEngine e GPU completion.

## Resultado

Foram capturados seis traces de 6,3 a 8,5 MB em `artifacts/perfetto/agenda/`,
com MacroDroid em force-stop e um processo novo do app por amostra. O primeiro
frame associado ao toque foi localizado pelo `inputEventId` do Frame Timeline;
as métricas abaixo cobrem os 1,5 s seguintes.

| Direção     | Rodada | p90 Frame Timeline | Maior `doFrame` | Maior `traversal` | Maior `Record View#draw()` |
| ----------- | -----: | -----------------: | --------------: | ----------------: | -------------------------: |
| Home→Agenda |      1 |           29,40 ms |        74,64 ms |          65,21 ms |                   59,96 ms |
| Home→Agenda |      2 |           20,22 ms |        72,73 ms |          64,34 ms |                   59,10 ms |
| Home→Agenda |      3 |           29,79 ms |        74,10 ms |          65,62 ms |                   60,73 ms |
| Agenda→Home |      1 |           24,70 ms |        44,49 ms |          21,31 ms |                   18,78 ms |
| Agenda→Home |      2 |           26,61 ms |        31,44 ms |          13,96 ms |                   10,27 ms |
| Agenda→Home |      3 |           25,40 ms |        39,30 ms |          20,26 ms |                   13,86 ms |

O hotspot Home→Agenda é repetível e está na main thread, no desenho da árvore
nativa: os frames de 72,73–74,64 ms gastaram 67,21–68,80 ms efetivamente em CPU,
somente 0,87–1,22 ms prontos aguardando scheduling e 4,03–4,64 ms bloqueados. Em
contraste, o maior `DrawFrames` da RenderThread ficou em 10,91–14,28 ms e a maior
espera de GPU em 11,64–13,03 ms. Não houve evento de GC em nenhuma das seis
janelas, e não há `gpu_slice` disponível neste driver; GPU completion e
SurfaceFlinger foram correlacionados pelas suas threads e slices/fences.

O `gfxinfo` confirma 246 views anexadas na Agenda contra 192 na Home. A grade do
calendário é a principal concentração visível de views (42 células, cada uma com
wrapper, `AnimatedPressable` e texto), portanto é o primeiro A/B orientado pelo
trace: reduzir/achatar apenas a árvore das células e repetir o mesmo protocolo.
Essa atribuição ao calendário é uma hipótese de componente, não uma conclusão do
Perfetto; a conclusão comprovada é `Record View#draw()` na main thread.

## A/B — árvore das células do calendário

O A/B fundiu o wrapper e o controle de cada dia do mês em um único `Pressable`,
preservando seleção, feedback háptico, estado pressionado e acessibilidade. Em
setembro de 2026, isso reduziu a árvore anexada da Agenda de 246 para 216 views
(−30). O grid de sete colunas e os estados visuais foram conferidos no aparelho
antes da captura.

Os seis traces foram repetidos com o mesmo protocolo, em
`artifacts/perfetto/agenda-calendar-flat/`:

| Direção     | Rodada | p90 Frame Timeline | Maior `doFrame` | Maior `traversal` | Maior `Record View#draw()` |
| ----------- | -----: | -----------------: | --------------: | ----------------: | -------------------------: |
| Home→Agenda |      1 |           26,20 ms |        54,89 ms |          48,23 ms |                   44,29 ms |
| Home→Agenda |      2 |           21,03 ms |        57,51 ms |          50,07 ms |                   45,96 ms |
| Home→Agenda |      3 |           25,15 ms |        57,55 ms |          51,71 ms |                   47,04 ms |
| Agenda→Home |      1 |           25,86 ms |        32,22 ms |          13,79 ms |                    9,87 ms |
| Agenda→Home |      2 |           26,74 ms |        30,28 ms |          15,58 ms |                   14,13 ms |
| Agenda→Home |      3 |           22,61 ms |        28,13 ms |          12,76 ms |                    9,65 ms |

No fluxo crítico Home→Agenda, a mediana entre rodadas do maior `doFrame` caiu
de 74,10 para 57,51 ms (−22,4%), e a mediana de `Record View#draw()` caiu de
59,96 para 45,96 ms (−23,3%). Até o pior resultado melhorou: `doFrame` de 74,64
para 57,55 ms e desenho de 60,73 para 47,04 ms. A diferença é muito maior que a
variação dentro de cada bateria, portanto o A/B foi aceito.

## Build exclusivo para profiling

O perfil EAS `profiling` gera um APK com código release e define
`TAVI_PROFILEABLE_BUILD=1`. Somente nessa condição o config plugin acrescenta
ao `<application>`:

```xml
<profileable android:enabled="true" android:shell="true" />
```

O release normal não recebe a tag. Para validar depois do prebuild:

```powershell
$env:TAVI_PROFILEABLE_BUILD = '1'
pnpm.cmd exec expo prebuild --platform android --clean
Select-String -Path android/app/src/main/AndroidManifest.xml -Pattern profileable
```

## Protocolo de captura

1. Instalar o APK do perfil `profiling` em um aparelho com sessão e dados de
   teste prontos.
2. Conectar exatamente um dispositivo via ADB.
3. Executar `scripts/capture-nav-trace.ps1`. O script suspende o MacroDroid,
   inicia um processo novo por amostra e captura três traces Home→Agenda e três
   Agenda→Home.
4. Correlacionar em cada arquivo: thread principal do processo, RenderThread,
   fences/GPU completion, SurfaceFlinger, eventos de GC e estados de scheduling.

Em 5 de setembro de 2026, os quatro itens foram concluídos.

## Critério de encerramento

Se os seis traces não mostrarem um hotspot concreto e corrigível no aplicativo,
aceitar ~42–44 ms de p90 como teto conhecido da Agenda na arquitetura atual,
registrar a limitação e encerrar esta investigação. O hotspot era concreto e
parcialmente corrigível: o A/B delimitado reduziu o pior desenho em cerca de 23%
e foi mantido. Esta bateria não autoriza uma nova sequência aberta de tentativas;
qualquer experimento adicional precisa de outra hipótese delimitada e do mesmo
critério de parada.

A verificação representativa em Serviços confirmou a mesma assinatura de custo
na main thread e encerrou a frente para o beta. A decisão de escopo do app, seus
limites e os números dessa captura estão em
`docs/performance/app-structural-baseline.md`.

## Experimentos anteriores

O ledger completo das tentativas mantidas e revertidas está em
`docs/performance/agenda-investigation-history.md`. A infraestrutura inicial de
profiling foi consolidada no commit `e0a227f`, e o histórico pré-Perfetto no
commit `c0c854d`.
