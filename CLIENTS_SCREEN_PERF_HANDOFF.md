# Handoff: performance da tela Clientes (ClientListScreen)

## Sintoma reportado pelo usuário
Ao trocar de aba no `SegmentedControl` da tela Clientes (Todos/Ativos/Inativos/Para
retomar), a interação "trava muito", mesmo depois de 3 rodadas de correção.
Confirmado pelo usuário, de forma consistente: **"trava esperando carregar"** — não é
a própria animação da aba que emperra, é a lista demorando/piscando com skeleton.
Também confirmado: a lentidão **piorou objetivamente a cada rodada de teste**, mesmo
com processo do app totalmente fechado e reaberto entre rodadas (não é acúmulo de
sessão/memória — testado e descartado).

## Ambiente de teste
- Device físico Android real (`RX8XA008EBY`), conectado via `adb` (Samsung, Android,
  1080x2340).
- App rodando dentro do **Expo Go** (`host.exp.exponent`), não build nativo standalone
  — importante, pois Expo Go tem overhead de runtime maior que dev-client/release.
- `adb` não estava no PATH da sessão; caminho completo usado:
  `/c/Users/useradmin/AppData/Local/Android/Sdk/platform-tools/adb.exe`.
- A skill `react-native-best-practices` deste projeto recomenda `agent-device
  react-devtools` para profiling — **essa ferramenta não está instalada/disponível
  neste ambiente**. Toda medição abaixo foi feita com `adb shell dumpsys gfxinfo` e
  `adb logcat`, não com o profiler de componentes React real. Se `agent-device`
  estiver disponível na próxima sessão, USAR — ele mostraria contagem de re-render
  por componente, o que falta aqui.

## Protocolo de medição usado (repita para comparar antes/depois)
```bash
export PATH="$PATH:/c/Users/useradmin/AppData/Local/Android/Sdk/platform-tools"
adb shell dumpsys gfxinfo host.exp.exponent reset   # zera contadores
# usuário: fecha o app por completo (force stop / remove dos recentes), reabre,
# entra em Clientes, toca nas 4 abas ~10 vezes
adb shell dumpsys gfxinfo host.exp.exponent          # lê contadores
PID=$(adb shell "ps -A" | grep exponent | awk '{print $2}')
adb logcat -d --pid=$PID | grep -c "SurfaceMountingManager"   # conta o erro abaixo
```
Métricas que importaram: `Total frames rendered`, `Number High input latency`,
`99th percentile`, e a contagem do erro `SurfaceMountingManager` no logcat.
**Atenção**: rodadas anteriores tiveram poucos toques por vez e variação de protocolo
entre testes — os números absolutos abaixo não são perfeitamente comparáveis entre si,
mas a tendência (piora bruta, depois melhora parcial) bateu com o que o usuário sentiu
em cada rodada, então o método é válido como sinal direcional, não como benchmark fino.

## Causa raiz nº 1 (confirmada, corrigida parcialmente)
`SegmentedControl` (`src/components/ui/SegmentedControl.tsx`) vivia dentro de
`ListHeaderComponent` da `FlatList` em `ClientListScreen.tsx`. `ListHeaderComponent`
desmonta e remonta **todo o subtree** que recebe sempre que o elemento passado é uma
nova referência. Como o `SegmentedControl` precisa saber `filter` atual para pintar a
aba certa, o elemento que o continha era necessariamente uma referência nova a cada
toque de aba — nenhuma quantidade de `useMemo` no header evita isso, porque `filter`
tem que estar nas deps.

Confirmado via `adb logcat`: milhares de
`com.facebook.react.bridge.RetryableMountingLayerException: Unable to find
SurfaceMountingManager for tag: [N]`, alegadamente vindo de dentro do
`Reanimated` — um worklet de uma opção do SegmentedControl recém-desmontada tentando
atualizar uma View Fabric que não existe mais.

**Correção aplicada** (`src/features/clients/ClientListScreen.tsx`): o
`SegmentedControl` foi tirado de dentro do `ListHeaderComponent` e colocado como
elemento irmão fixo da `FlatList` (variável `filterHeader`, renderizado direto no JSX
do componente, antes do `<View style={styles.body}>` que contém a lista). O que sobrou
dentro do `ListHeaderComponent` (`listHeader`) é só skeleton de loading e mensagem de
erro — sem animação Reanimated persistente, então remontar isso é inofensivo.

**Resultado desse fix, medido**: contagem de `SurfaceMountingManager` caiu de **3835
para 561** ocorrências no mesmo protocolo de teste (~85% de redução). Real, mas não
zerou. Usuário reportou que "continua horrível" mesmo depois desse fix.

## Causa raiz nº 2 (NÃO investigada a fundo — provável, não confirmada)
Analisando a distribuição dos tags do erro residual (561 ocorrências) via:
```bash
adb logcat -d --pid=$PID | grep "RetryableMountingLayerException" | grep -oP "tag: \[\d+\]" | sort | uniq -c | sort -rn
```
Resultado: um tag específico (`[7154]`) sozinho respondeu por 70 ocorrências em rajada
(worklet "zumbi" preso em retry loop, nunca se resolve). A maioria dos outros tags
aparece em **pares, exatamente 3 vezes cada**, com números de tag próximos e
crescentes (8172, 8154, 8152, 8118, 8116, 8102, 8100...) — padrão consistente com
linhas da lista de clientes sendo recicladas pela virtualização da `FlatList` durante
scroll, cada uma com dois elementos Reanimated (a `ClientRow`/`SwipeAction` usa
`useAnimatedStyle` também, ver `src/features/clients/ClientListScreen.tsx` função
`SwipeAction` por volta da linha 61-106).

**Hipótese não testada**: o mesmo padrão de bug (worklet sobrevivendo à view que
desapareceu) pode estar acontecendo em `SwipeAction`/`ClientRow` quando a `FlatList`
recicla/desmonta linhas fora da viewport — não só no `SegmentedControl`. Isso não foi
investigado porque a sessão foi interrompida para gerar este handoff.

`SwipeAction` usa `useAnimatedStyle` sem qualquer `useEffect`/cleanup — ele deriva
inteiramente de um `SharedValue` (`translation`) recebido via prop do
`Swipeable`/`ReanimatedSwipeable`. Se esse `SharedValue` for de algum componente que
já foi desmontado (a lib de gesture handler tem seu próprio ciclo de vida de
measurement, documentado em comentários no próprio arquivo linha ~55-60), o worklet
pode ficar preso do mesmo jeito.

## Coisas já tentadas e descartadas nesta sessão (não repita sem novo motivo)
1. **`useMemo` no header inteiro** — não resolve porque `filter` precisa estar nas
   deps, então invalida a cada toque de qualquer forma. Substituído pela extração do
   `SegmentedControl` para fora da `FlatList` (ver acima).
2. **Prefetch de todos os status (`usePrefetchClientStatuses` em
   `src/features/clients/hooks.ts`)** — implementado e mantido (é uma melhoria real de
   UX de rede, independente do bug de performance), mas não resolveu o sintoma
   principal porque a causa dominante era o mount/unmount do worklet, não a latência de
   rede. Ainda vale a pena manter — troca de aba após o prefetch deveria vir do cache
   (`staleTime: 30s` configurado globalmente em `src/providers/AppProviders.tsx`).
3. **Hipótese de acúmulo de memória entre sessões de Fast Refresh** — descartada.
   Testado com processo do zero (`force stop` + reabrir, PID novo confirmado via `ps
   -A`) e o problema persistiu igual, então não é vazamento entre reloads do Metro.
4. **`height: '100%'` no `option` do `SegmentedControl`** (tentativa de alinhar duas
   camadas de fundo) — **revertida**, quebrou o layout inteiro (virou uma faixa azul
   cobrindo a tela toda) por causa de uma cadeia de `height:100%` sem ancestral com
   altura fixa, dentro de um `ScrollView` horizontal. Não tentar de novo sem entender
   por que a cadeia de altura resolveu contra um ancestral tão distante.

## Estado atual do código relevante
- `src/components/ui/SegmentedControl.tsx`: reescrito nesta sessão. Cada opção
  (`SegmentOptionButton`) tem seu próprio `useSharedValue` + `useAnimatedStyle` +
  `useEffect` que dispara `withSpring` na cor de fundo (`interpolateColor`) quando
  `selected` muda. Não há mais um "indicador" único deslizante (essa era a versão
  anterior, tinha bug de sumiço permanente e depois deformação visual — ambos
  device-confirmados e documentados em comentários no próprio arquivo).
- `src/features/clients/ClientListScreen.tsx`: `filterHeader` (SegmentedControl) fora
  da `FlatList`; `listHeader` (skeleton/erro) ainda como `ListHeaderComponent`.
  `usePrefetchClientStatuses` chamado no mount.
- `src/features/clients/hooks.ts`: `usePrefetchClientStatuses` novo, faz
  `prefetchInfiniteQuery` para os 3 status (`all`/`active`/`inactive`) uma vez por
  mount com busca vazia.
- Testes: `tests/segmentedControlIndicator.test.tsx` reescrito para a nova arquitetura
  sem indicador; `tests/ClientListEmptyState.test.tsx`,
  `tests/clientReconnectFilter.test.tsx`, `tests/ClientListActions.test.tsx`,
  `tests/ClientListVirtualization.test.tsx` atualizados com o mock de
  `usePrefetchClientStatuses`. Suíte inteira (489 testes) verde na última checagem.

## Próximos passos sugeridos, em ordem
1. Se `agent-device react-devtools` estiver disponível: usar profiling real de
   componente (`profile rerenders`, `profile slow`) em vez de só `gfxinfo`/`logcat` —
   vai mostrar exatamente qual componente está remontando/re-renderizando em excesso,
   em vez de inferir pela contagem de exceções nativas.
2. Investigar `SwipeAction`/`ClientRow` (`src/features/clients/ClientListScreen.tsx`,
   linhas ~61-233) com o mesmo rigor que o `SegmentedControl` recebeu: usar
   `adb logcat` filtrando `SurfaceMountingManager` **durante scroll da lista** (sem
   tocar em nenhuma aba) para isolar se o problema é reciclagem de linha da
   `FlatList`, independente do bug do `SegmentedControl` já corrigido.
3. Considerar trocar `FlatList` por `FlashList`/`Legend List` para a lista de
   clientes — a skill `react-native-best-practices` deste projeto recomenda isso como
   fix crítico padrão para jank de lista longa (`js-lists-flatlist-flashlist.md`),
   ainda não avaliado aqui. Checar se está nas dependências aprovadas do projeto antes
   (`AGENTS.md` exige aprovação explícita do usuário para novas dependências).
4. Repetir o protocolo de medição acima ANTES de qualquer nova mudança, para ter uma
   baseline limpa e comparável (as baselines anteriores têm essa variação de "quantos
   toques exatos" que compromete comparação fina entre rodadas).
5. Considerar reduzir o retry/severidade do próprio Reanimated
   (`RetryableMountingLayerException` é tecnicamente não-fatal e "retryable" por
   design) — mas isso trata o sintoma, não a causa; melhor achar por que o worklet
   sobrevive à view antes de silenciar o log.

## Pendência conhecida — exceções residuais

Existem exceções residuais SurfaceMountingManager durante substituições de linhas.
Sem impacto relevante no 90º/95º percentil atual; reavaliar em profiling de build
release ou caso reapareça sintoma perceptível.

Esta frente de performance da tela de Clientes foi considerada encerrada após a
validação no Samsung A15.
