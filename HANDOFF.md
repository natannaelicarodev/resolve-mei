# Handoff — Home do Tavi

Contexto para continuar o trabalho a partir do estado atual do repositório.
Tudo abaixo foi verificado no código, não é suposição.

---

## 1. Onde o trabalho parou

A Home (`/home`) foi reconstruída como **hub de navegação**, não como painel
financeiro. Ela mostra atalhos para as áreas do negócio e, no máximo, uma
sugestão de configuração. **Nenhum valor monetário aparece nela** — isso é
regra, não acaso, e existe um teste que falha se um `R$` voltar.

Arquivos vivos:

| Arquivo | Papel |
|---|---|
| `src/features/daylight/theme.ts` | Tokens do tema claro, derivados de `src/theme/colors.ts` |
| `src/features/daylight/Illustration.tsx` | Registro de ilustrações por papel |
| `src/features/daylight/DaylightPrimitives.tsx` | `Tappable`, `Enter`, `Card`, `ShortcutTile` |
| `src/features/daylight/DaylightHomeScreen.tsx` | A tela |
| `app/(protected)/home.tsx` | Rota real |
| `app/home-preview.tsx` | Harness `__DEV__` para inspeção sem sessão |

---

## 2. Decisão de direção visual (importante — foi errada cinco vezes)

`SPEC-home-bright-desk.md`, escrito **antes** desta sessão (ver linhas 7 e 13):

> *"dark mode + mint AI dashboard" was rejected — light is the flagship state,
> since dark was half of what got rejected.*

Cinco tentativas foram feitas em tema escuro, todas reprovadas pelo usuário,
contra uma decisão que já estava documentada no repositório. **A direção é
tema claro.** Referência aprovada: o app Trinta (fundo claro, cards brancos,
ilustrações 3D coloridas, header de marca).

Cor de marca: **verde `#0C8479`**, que já existia em `src/theme/colors.ts`.
O usuário rejeitou explicitamente copiar o amarelo do Trinta.

Regra que se aplica a qualquer trabalho novo aqui: **não crie uma nova paleta.**
`daylight/theme.ts` apenas renomeia tokens existentes para a linguagem do
produto (`income`, `expense`, `pending`). Uma sexta paleta seria o sexto erro.

---

## 3. Pendência imediata: ilustrações 3D

O usuário copiou `assets/3dicons-meta/` — **120 arquivos `.md`, zero PNGs.**
Os arquivos são metadados; cada um contém as URLs do CDN. Exemplo real
(`assets/3dicons-meta/money.md`):

```
color: https://3dicons.sgp1.cdn.digitaloceanspaces.com/v1/dynamic/color/money-dynamic-color.png
```

Licença verificada: **CC0 1.0 Universal** — domínio público, uso comercial
livre, sem atribuição. Adequado para a Google Play.

O que falta fazer:

1. Baixar os PNGs das URLs `color:` para `assets/illustrations/`.
   **Peça autorização ao usuário antes** — baixar de CDN externo é uma ação
   de rede que ele deve aprovar.
2. Preencher o mapa `ARTWORK` em `src/features/daylight/Illustration.tsx`.
   Ele já está tipado como `Partial<Record<…>>` justamente para ser preenchido
   um arquivo por vez.
3. **Nenhuma tela precisa mudar.** As telas pedem `income`, `client`, `quote` —
   nunca um nome de arquivo. Enquanto um PNG não existir, o componente cai
   para um ícone lucide tintado.

Slots já declarados: `income`, `expense`, `pending`, `approved`, `client`,
`service`, `quote`, `catalog`, `stats`, `empty`.

Ícones do pacote que servem ao domínio: `money`, `chart`, `file-text`, `boy`,
`calender`, `card`, `bag`, `folder`, `notebook`.

---

## 4. Próxima tela: balanço / faturamento

O usuário disse que **tudo sobre balanço e faturamento vai para outra tela.**
Essa tela ainda não existe.

Os componentes que serviam para isso foram escritos e depois removidos da Home
quando ela virou hub. Estão no histórico do git, não no working tree:

- `LedgerRow` — linha de extrato: ilustração, duas linhas de texto, valor, chevron
- `SegmentedPeriod` — seletor de período com indicador deslizante animado
- `ActionTile` — tile de métrica

Recupere com `git diff` sobre `src/features/daylight/DaylightPrimitives.tsx`,
ou reescreva a partir dos padrões que sobraram no arquivo.

Camada de domínio pronta para essa tela, **já testada**:

- `src/features/home/pipeline.ts` — `buildPipeline`, `summarizePipeline`,
  `describeBlock`, `nextActionLabel`. Ordena orçamentos por custo de ignorar
  (vencido > vence-agora > aguardando > rascunho), desempata por valor.
- `src/features/operations/fromQuotes.ts` — `healthFromQuotes`, `hubFromData`,
  `pendingFromQuotes`. Converte `Quote[]` em modelos de tela.

---

## 5. Limite do schema — não invente funcionalidade

O banco vai de `clients` a `quotes` e para. Verificado em
`src/types/database.ts`:

```
profiles · businesses · clients · services · quotes · quote_items
RPCs: get_home_dashboard · save_quote · transition_quote · duplicate_quote
```

**Não existem** `appointments`, `invoices`, `payments`, `transactions`.
`allowedQuoteTransitions.approved` é uma lista vazia — o ciclo termina em
Aprovado.

Consequência prática: agenda, cobrança, recebimento e "entradas e saídas" são
proposta de produto, não funcionalidade. Se for desenhá-los, marque como tal.
Uma tela que mistura o que roda com o que não roda ensina o dono a não confiar
nela.

Campo subusado que vale explorar: `services.estimated_duration_minutes` — é a
unidade que distingue um prestador de serviço de qualquer outro negócio, e
aparece nas telas de Serviços mas em nenhum lugar da Home.

---

## 6. Armadilhas técnicas já encontradas (não repita)

### Reanimated: nunca leia `.value` no render

Isso travou o app inteiro uma vez. Em `MorphingTray.tsx` havia:

```tsx
if (!visible && progress.value === 0) return null;
```

Ao fechar, `visible` vira `false` mas `progress.value` leva 180ms para zerar.
A condição fica falsa, o componente não desmonta, e um `Pressable` de tela
cheia continua sobre o app engolindo todo toque — com haptic a cada clique.

Correção: estado React (`visible || closing`) decide a montagem.
Ver `tests/warmReanimatedSafety.test.ts`, que varre os arquivos e falha se
qualquer `.value` for lido fora de `useAnimatedStyle` / `useDerivedValue` /
worklet.

### Timer de saída vai em `useRef`, não no cleanup do efeito

O cleanup cancela o próprio timer que acabou de armar no re-render seguinte, e
a sheet fica montada para sempre. Também não use o callback de conclusão da
animação: uma animação interrompida nunca reporta `finished`.

### Mock do Reanimated resolve animações instantaneamente

Consequência: **um teste de comportamento pode passar com o código bugado.**
Aconteceu — os primeiros testes do MorphingTray passaram com o defeito
presente. Para bugs de timing, teste também a origem do arquivo, e
**verifique revertendo a correção**: se o teste continua verde com o bug, ele
não vale nada.

### `noUncheckedIndexedAccess` está ligado

`array[i]` é `T | undefined`. Use `!` quando o índice for provadamente válido,
ou `?? fallback`.

### Servidores Expo sobrevivem ao `TaskStop`

O processo pai morre, os filhos continuam escutando. Se `pnpm dev` reclamar de
porta em uso: `netstat -ano | grep :8081` e mate o PID.

### `.expo/types/router.d.ts` corrompe ao matar o servidor

Fica truncado e quebra o `typecheck` com erro que **não é do seu código**.
Apague; regenera sozinho.

---

## 7. Estado da verificação

```
pnpm typecheck   limpo
pnpm lint        sem problemas (1 aviso em router.d.ts, arquivo gerado)
pnpm test        376 passam, 2 falham
```

**As 2 falhas são pré-existentes** — não foram causadas por este trabalho.
Confirmado com `git stash`. São:

- `tests/AppErrorBoundary.test.tsx` — espera `role: alert`, não encontra
- `tests/visualNavigationArchitecture.test.ts` — espera `<Input` em
  `QuoteListScreen.tsx`

Ambas em arquivos fora do escopo da Home. Valem conserto, mas são trabalho
separado.

---

## 8. Limpeza pendente

Duas features ficaram órfãs — direções rejeitadas, **nenhum arquivo as importa**:

- `src/features/operations/` (8 arquivos) — direção escura com núcleo 3D
- `src/features/warm/` (5 arquivos) — direção "Warm Premium" cacau/eucalipto

Testes associados que também podem sair se as features saírem:
`tests/asciiIcosahedron.test.ts`, `tests/operationsCoreContext.test.ts`,
`tests/operationsFromQuotes.test.ts`, `tests/morphingTrayDismiss.test.tsx`,
`tests/warmReanimatedSafety.test.ts`.

**Confirme com o usuário antes de apagar.** Há trabalho aproveitável ali:
o rasterizador ASCII de icosaedro (matemática pura, 0.014ms/frame, sem WebGL)
e o padrão de tray com altura medida.

`src/features/home/prototype/` é anterior a esta sessão e está fora deste
escopo.

---

## 9. Mudanças fora da Home que já foram feitas

- **`ProtectedBottomNavigation`** agora usa tokens de tema em vez de hex
  literais. Afeta Clientes, Serviços, Orçamentos e Perfil — todas ficaram
  coerentes com o tema claro. Antes era `#0A0A0A` fixo.
- **`app/_layout.tsx`** ganhou `GestureHandlerRootView` (sem ele nenhum gesto
  recebe toque) e a fonte Geist.
- **`babel.config.js`** foi criado com `react-native-worklets/plugin` — sem
  ele o Reanimated 4 ignora todo `'worklet'` e os gestos caem na thread JS.
- **`tests/setup.ts`** ganhou mocks de Reanimated e safe-area;
  **`jest.config.js`** mapeia `react-native-gesture-handler` para
  `tests/mocks/gestureHandler.js`.

Dependências removidas por não serem mais usadas: `three`, `expo-gl`,
`@types/three`, `moti`.

---

## 10. Como verificar visualmente

`/home` exige sessão. Para inspecionar sem login:

```bash
pnpm exec expo start --web --port 8099
# abrir http://localhost:8099/home-preview
```

`app/home-preview.tsx` renderiza exatamente o que `/home` renderiza, com
fixtures. É `__DEV__`-only.

**Nada foi testado em device Android ou iOS nesta sessão** — só web. Vale
conferir no aparelho: a `StatusBar` clara sobre header verde, e o
comportamento de `BlurView` se ele voltar a ser usado.
