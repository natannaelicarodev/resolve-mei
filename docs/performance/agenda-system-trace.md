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

| Direção | Rodada | p90 Frame Timeline | Maior `doFrame` | Maior `traversal` | Maior `Record View#draw()` |
| --- | ---: | ---: | ---: | ---: | ---: |
| Home→Agenda | 1 | 29,40 ms | 74,64 ms | 65,21 ms | 59,96 ms |
| Home→Agenda | 2 | 20,22 ms | 72,73 ms | 64,34 ms | 59,10 ms |
| Home→Agenda | 3 | 29,79 ms | 74,10 ms | 65,62 ms | 60,73 ms |
| Agenda→Home | 1 | 24,70 ms | 44,49 ms | 21,31 ms | 18,78 ms |
| Agenda→Home | 2 | 26,61 ms | 31,44 ms | 13,96 ms | 10,27 ms |
| Agenda→Home | 3 | 25,40 ms | 39,30 ms | 20,26 ms | 13,86 ms |

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
registrar a limitação e encerrar esta investigação. Esse encerramento ainda não
se aplica: os traces revelaram um hotspot repetível de desenho na main thread e
um A/B delimitado para testar a sua corrigibilidade.

## Experimentos anteriores

O ledger completo das tentativas mantidas e revertidas está no handoff externo.
O repositório preserva apenas parte dele em `CLIENTS_SCREEN_PERF_HANDOFF.md`; os
experimentos da Agenda aparecem consolidados no commit `0aa6227`, sem commits
atômicos individuais para cada A/B. A configuração e este resultado de profiling
ainda estão sem commit.
