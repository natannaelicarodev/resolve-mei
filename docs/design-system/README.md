# Design system ResolveMEI

## Princípios

1. Humano antes de burocrático: linguagem curta, estados claros e ações previsíveis.
2. Confiança sem aparência bancária: verde funcional, grafite suave e superfícies leves.
3. Inclusão prática: alvos de toque de 44 px, fonte ampliável, contraste AA e status com texto.
4. Movimento com propósito: confirmar causa e efeito, nunca atrasar trabalho ou esconder conteúdo.
5. Densidade móvel saudável: espaço suficiente para leitura sem transformar cada seção em card.

## Identidade

A marca é **índigo** (`#4C3A9E` claro, `#A99CF5` escuro), com **âmbar** (`#B45309` claro, `#F0A742` escuro) como acento de dado. A composição usa títulos fortes, superfícies claras e raios amigáveis, sem copiar paleta, marca, assets ou composições da Family.

### Por que índigo, e por que não é o roxo anterior

Este projeto já rejeitou uma direção roxa antes ("ameixa e pêssego"). A diferença é deliberada e vale registrar para não repetir o erro:

- O índigo escolhido é **profundo e sóbrio**, puxado para o azul (matiz ~253°), não um roxo puro e frio como `#8B5CF6`. Em superfícies claras ele lê como tinta, não como cor decorativa.
- O acento é **âmbar quente**, não pêssego. Ele contrapõe a temperatura fria do índigo e evita a monocromia que tornava a tentativa anterior monótona.
- O âmbar é **acento de dado**, não segunda cor de marca: aparece em tendências, gráficos e destaques pontuais. Não existe variante `accent` de `Button` — colocar âmbar e índigo na mesma forma de componente, na mesma tela, seria disputa, não contraponto.

### Verde é semântico, nunca marca

O verde deixou de ser `primary`. Ele agora significa exclusivamente estado: `success`, aprovado, ativo. Um teste de matiz em `visualNavigationArchitecture.test.ts` trava essa regra — `primary` precisa ficar na faixa 230–290° e `success` na faixa 90–180°, então uma regressão para verde de marca falha o gate.

### Modo escuro: quase-preto com subtom roxo

`background` é `#0E0B14` — quase-preto com subtom roxo, nunca `#000000`. Preto absoluto achata a elevação e é meta a evitar neste projeto. As camadas sobem em luminância de forma monotônica:

| Camada             | Valor     | Luminância |
| ------------------ | --------- | ---------- |
| `background`       | `#0E0B14` | 0,0038     |
| `backgroundSubtle` | `#15111D` | 0,0065     |
| `surface`          | `#1E1829` | 0,0109     |
| `surfaceElevated`  | `#2A2338` | 0,0198     |
| `surfacePressed`   | `#332B45` | 0,0286     |

Cada passo é 45–82% mais claro que o anterior, o que mantém cartão e modal legíveis sobre o fundo. Dois testes cobrem isso: um exige a progressão monotônica, outro proíbe `#000000` como fundo.

### Modo claro: branco com índigo contido

`background` é `#FBFAFC` e `surface` é branco puro. O índigo aparece com contenção — botões, seleção, ícones ativos, avatares — nunca pintando grandes superfícies.

### Contraste verificado, não estimado

Todos os pares que a interface realmente renderiza foram calculados e são verificados no gate por `meets WCAG AA on the pairs the interface actually renders`: texto sobre fundo/superfície/superfície elevada, texto sobre primary e danger, primary e âmbar como texto, pares semânticos sobre seus `Subtle`, texto desabilitado, e `borderStrong`/`focusRing` como elementos de interface (mínimo 3:1). Ambos os temas passam em todos.

## Tokens

Os tokens ficam em `src/theme` e são semânticos. Componentes devem consumir nomes como `textSecondary`, `successSubtle` e `focusRing`, nunca hexadecimais locais. Espaçamentos seguem múltiplos de 4. Inputs e botões usam raios de 14 px; cards usam 24 px; pills e círculos usam raio total.

As combinações principais foram escolhidas para WCAG AA: grafite sobre fundos claros, branco sobre verde principal, branco sobre vermelho de perigo e textos escuros nos fundos sutis. Status sempre inclui texto, símbolo ou papel acessível.

### Temas

O ResolveMEI oferece `Sistema`, `Claro` e `Escuro`. A escolha é persistida apenas neste dispositivo com AsyncStorage e não integra perfil, API ou Supabase. `Sistema` acompanha `useColorScheme`; as primitives consomem cores semânticas pelo `ThemeProvider`. O tema escuro usa superfícies em grafite esverdeado, sem preto absoluto, neon ou linguagem visual de fintech.

## Referência Nucleus UI Lite

O arquivo completo foi inspecionado pelo plugin do Figma antes da revisão visual da Home. A implementação usa a gramática e os estados dos componentes, mantendo conteúdo, marca, cores semânticas e fluxos próprios do ResolveMEI.

| Componente verificado         | Node ID    | Aplicação no ResolveMEI                          |
| ----------------------------- | ---------- | ------------------------------------------------ |
| Controls / Buttons            | `1:11`     | estados normal, pressionado e desabilitado       |
| Primary block button          | `1:7`      | referência de altura, hierarquia e área de toque |
| Icon buttons                  | `498:6134` | ação discreta de configurações                   |
| Nav Bars / Standard           | `5:43`     | cabeçalho compacto e sem hero                    |
| Tab Bars / Icon & Text        | `34:744`   | navegação inferior com ícone e rótulo            |
| Views / Tables and list items | `66:735`   | resumo horizontal do negócio                     |
| Avatar list item              | `104:1608` | avatar, texto principal e ação à direita         |
| Avatars                       | `94:935`   | proporções do avatar do usuário e logotipo       |
| Badge pill                    | `655:21`   | único status de perfil configurado               |
| Dividers                      | `27:66`    | separação estrutural discreta                    |

Foram rejeitados para a Home: tab bar somente com ícones (`762:5898`), por reduzir clareza; tabelas desktop, por não atenderem ao contexto mobile; bottom sheets (`878:7298`), popovers e gráficos, pois não existe conteúdo funcional que os justifique; e repetição de badges, que faria a interface parecer demonstração do kit.

## Tipografia

Manrope foi escolhida pela leitura clara de acentos, números distinguíveis e boa presença em Android. São usados somente os pesos 400, 500, 600 e 700. A fonte está sob SIL Open Font License 1.1, conforme o pacote `@expo-google-fonts/manrope`.

O splash permanece visível durante o carregamento. Se a fonte falhar, o aplicativo segue com a fonte do sistema. Textos permitem escala do sistema; truncamento só acontece quando `truncate` ou `numberOfLines` é explícito. Valores financeiros usam números tabulares.

## Componentes

- `Text`: variantes semânticas, cor, alinhamento e truncamento explícito.
- `Button`: primary, secondary, ghost e danger; três tamanhos; loading, success e disabled.
- `Input`: label persistente, ajuda, erro, contador, foco, preenchido, disabled e read-only.
- `Card`: default, elevated, interactive, highlighted e variantes de status.
- `Screen`: safe area, largura máxima, fundo, scroll opcional e keyboard avoiding.
- `IconButton`: alvo mínimo, label obrigatório, loading e disabled.
- `Badge`: status textual em pill; cor nunca é o único sinal.
- `InlineFeedback`: success, error, warning e info com live region.
- `Skeleton`: dimensões estáveis e pulsação leve, sem shimmer pesado.
- `SegmentedControl`: escolhas curtas e mutuamente exclusivas com estado selecionado textual e haptic semântico.
- `ConfirmationDialog`: confirmação de ação sobre `Modal` centralizado, com backdrop, dismiss seguro, foco anunciado, Reduced Motion e bloqueio de toque duplicado.

## Confirmações

Toda ação destrutiva ou irreversível usa `ConfirmationDialog`, nunca `Alert.alert`. O diálogo nativo não oferece foco previsível, backdrop próprio, Reduced Motion nem prevenção de toque duplicado, e no iOS sinaliza destruição apenas por cor — ignorada no Android.

A implementação é um modal centralizado sobre o `Modal` do React Native, mesmo padrão do seletor de período da Home. O plano permite modal ou bottom sheet; foi escolhido `Modal` por já existir no projeto e não exigir dependência nativa adicional. Não há bottom sheet com gesto de arrastar ou snap points no aplicativo.

O botão de confirmação usa `Button variant="danger"` quando a ação é destrutiva, o que garante o ícone de alerta e evita depender de cor. O rótulo nomeia a ação ("Inativar cliente", "Descartar alterações"), nunca "Confirmar" genérico. Backdrop e botão físico de voltar sempre cancelam.

## Aplicação nas telas

Na Etapa 2, autenticação, onboarding, home, perfil, configurações, loading e erros passaram a consumir esta fundação. O onboarding usa cinco etapas visuais sobre um único formulário e mantém uma única submissão final. O perfil alterna entre dados pessoais e profissionais sem misturar mutations ou payloads. A Home usa um cabeçalho compacto, resumo verdadeiro do negócio, três ações rápidas desabilitadas e um estado vazio orientado ao primeiro uso. Recursos inexistentes não recebem rotas, métricas ou dados fictícios.

## Motion e haptics

`AnimatedPressable`, `FadeInView`, `StepTransition` e `SuccessTransition` cobrem os usos previstos nas próximas etapas. Press usa escala 0,98 por 100 ms; entradas usam 260 ms e deslocamento de 8 a 20 px. Reduced Motion remove deslocamento e simplifica springs.

Haptics é opcional, centralizado em `src/lib/haptics.ts` e falhas nunca bloqueiam ações. Use apenas para seleção relevante, sucesso, alerta ou erro. Não use em scroll, campo, toda navegação ou como único feedback.

## Scroll e teclado

- Use `ScrollView` apenas para conteúdo pequeno e formulários de tamanho conhecido.
- Use `FlatList` para coleções potencialmente grandes e `SectionList` para grupos extensos.
- Formulários usam `keyboardShouldPersistTaps="handled"` e `keyboardAvoiding` quando necessário.
- Ao validar, foque e role para o primeiro erro; preserve os valores digitados.
- Reserve espaço inferior para teclado e ações; ação fixa só quando não encobrir conteúdo.
- Header sticky exige ganho real de contexto. Pull-to-refresh só quando o usuário espera atualização remota.
- Não anime dezenas de itens de uma lista. Stagger futuro deve limitar itens e usar 40 ms.

## Uso

```tsx
<InlineFeedback variant="success" message="Orçamento salvo." />
<Button label="Criar orçamento" haptic="selection" size="large" />
<Input label="Nome do cliente" helperText="Como aparecerá no documento." />
```

## Anti-padrões

- Hexadecimais e espaçamentos arbitrários dentro de features.
- Card dentro de card ou toda seção flutuando.
- Feedback somente por cor, haptic ou animação.
- Texto essencial truncado por acidente.
- Skeleton com shimmer pesado, sombra em listas ou animação em toda renderização.
- `ScrollView` para clientes, serviços, orçamentos ou outras listas crescentes.

## Critérios para novos componentes

Crie um componente compartilhado somente quando houver pelo menos dois usos reais ou quando ele centralizar acessibilidade/estado complexo. Defina API específica, tokens consumidos, comportamento com fonte ampliada, Reduced Motion, testes de comportamento e exemplo no catálogo. Não crie abstração genérica apenas para antecipar uma possibilidade.
