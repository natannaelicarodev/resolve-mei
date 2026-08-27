# Design system ResolveMEI

## Pesquisa de produto e decisão visual

Foram consultadas páginas oficiais em 27/08/2026. A análise extrai princípios de produto, não identidade visual nem trade dress.

| Produto           | Público                       | Força visual/UX                            | Listas e finanças                             | Princípio aplicável                         | Não copiar                                |
| ----------------- | ----------------------------- | ------------------------------------------ | --------------------------------------------- | ------------------------------------------- | ----------------------------------------- |
| Conta Azul        | PMEs brasileiras              | organização operacional e linguagem direta | visão consolidada da gestão                   | reduzir carga cognitiva e explicar métricas | azul dominante, estrutura de ERP          |
| Asaas             | pequenos negócios e cobrança  | ação financeira evidente                   | cobranças e pagamentos em um só lugar         | separar ação principal do resumo            | aparência de conta bancária               |
| Square Invoices   | autônomos e pequenos negócios | fluxo rápido para orçamento/fatura         | clientes, estimativas e pagamentos conectados | linhas densas e CTA inequívoco              | composição e linguagem comercial próprias |
| QuickBooks Mobile | pequenos negócios             | continuidade entre resumo e detalhe        | números priorizados com contexto              | valores legíveis e navegação previsível     | densidade de software contábil            |
| Wave              | micro e pequenos negócios     | faturamento simples                        | invoices como coleção operacional             | empty states orientados à primeira ação     | identidade e ilustrações                  |
| FreshBooks        | prestadores de serviço        | tom próximo e profissional                 | clientes e faturas com status claros          | status textual e ações fáceis de encontrar  | paleta e componentes proprietários        |
| Zoho Invoice      | pequenos prestadores          | cobertura funcional sem tabela no mobile   | filtros por status e documentos               | filtros curtos, operáveis e persistentes    | densidade de suíte corporativa            |
| Family            | pessoas iniciando em cripto   | interface amigável e baixa carga cognitiva | conteúdo principal com ações previsíveis      | clareza, respiro e progressão sem ansiedade | marca, paleta, layouts e linguagem Web3   |

Fontes: páginas oficiais da [Conta Azul](https://contaazul.com/), [Asaas](https://www.asaas.com/), [Square Invoices](https://squareup.com/us/en/invoices), [QuickBooks Mobile](https://quickbooks.intuit.com/accounting/mobile/), [Wave](https://www.waveapps.com/invoicing), [FreshBooks](https://www.freshbooks.com/invoice), [Zoho Invoice](https://www.zoho.com/invoice), [Family](https://family.co/) e sua listagem oficial na App Store. A documentação de implementação segue a referência oficial do [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).

### Direções de paleta consideradas

| Opção                | Base                              | Acento           | Vantagem                                    | Risco                                   | Decisão     |
| -------------------- | --------------------------------- | ---------------- | ------------------------------------------- | --------------------------------------- | ----------- |
| A — Atlântico humano | azul profundo e neutros aquecidos | âmbar controlado | confiança, leitura documental e proximidade | exige evitar composição típica de banco | selecionada |
| B — terra e noite    | terracota e azul-noite            | areia luminosa   | acolhedora e memorável                      | ação principal pesada no uso prolongado | rejeitada   |
| C — mineral preciso  | grafite e azul-cobalto            | amarelo seco     | alta precisão e excelente contraste         | fria demais para autônomos iniciantes   | rejeitada   |

A opção A separa confiança de linguagem bancária: azul Atlântico identifica ação, seleção e foco; âmbar sinaliza energia e destaque editorial; verde aparece exclusivamente em sucesso, resultado positivo e estado ativo. Neutros aquecidos mantêm proximidade. O tema escuro usa carvão azulado e superfícies distintas, sem inversão mecânica.

### Contraste calculado

Razões calculadas com luminância relativa WCAG, também protegidas por `tests/colorContrast.test.ts`:

| Par                      |   Claro |  Escuro |
| ------------------------ | ------: | ------: |
| texto principal / fundo  | 14,23:1 | 16,56:1 |
| texto secundário / fundo |  7,12:1 | 11,09:1 |
| placeholder / superfície |  4,95:1 |  6,15:1 |
| texto / botão principal  |  6,47:1 |  8,16:1 |

Badges positive, warning, negative e info também são testados em 4,5:1. Texto desabilitado é visualmente distinto e semanticamente desabilitado; não carrega informação essencial sozinho.

## Contrato canônico v2

O sistema visual é mobile-first, humano e calmo. Usa superfícies quentes, azul Atlântico, âmbar pontual, Manrope, hierarquia por composição e elevação funcional. Não usa estética bancária, gradientes decorativos, glassmorphism, card em toda seção ou animação ornamental.

### Cores e temas

Componentes usam o conjunto canônico consolidado: `primary`, `primaryPressed`, `primarySubtle`, `primaryMuted`, `textInverse`, `background`, `backgroundSubtle`, `surface`, `surfaceElevated`, `surfaceInteractive`, `surfaceSelected`, `surfaceDisabled`, `surfacePressed`, `borderSubtle`, `borderStrong`, `textPrimary`, `textSecondary`, `textMuted`, `textDisabled`, `accent`, `success`, `successSurface`, `warning`, `warningSurface`, `danger`, `dangerSurface`, `info`, `infoSurface`, `overlay`, `skeletonBase`, `skeletonHighlight` e `focusRing`. Os aliases redundantes (`brandPrimary*`, `secondary`, `accentCoral`, `positive*`, `negative*`, variantes `*Subtle`/`*Soft`, `border`, `disabled`, `text`, `focus`, `disabledText`, `divider`, `textOnPrimary`, `textOnDanger`) foram removidos nesta rodada — não são mais válidos, o `tsc` falha se algum for referenciado.

O tema claro diferencia o fundo quente `#F7F5F2` das superfícies e usa `#24556F` como ação principal. O escuro usa planos carvão-azulados (`#121A1F`, `#1B252B`, `#222E35`) e ação `#8EC5DE`, nunca preto absoluto. Cada tema possui estados pressed, selected, disabled, focus e scrim próprios; o escuro não é uma inversão do claro.

### Tipografia

Manrope permanece por legibilidade de acentos e números. A escala é `display`, `pageTitle`, `sectionTitle`, `cardTitle`, `body`, `bodyMedium`, `bodySmall`, `label`, `caption`, `button`, `monetaryHero`, `monetaryValue`, `badge` e `navigation`. Títulos curtos aceitam até duas linhas; corpo reflow sem limite; badges e navegação usam textos curtos; valores monetários usam numerais tabulares e preservam uma linha. Truncamento só pode ser explícito.

### Espaço, forma e elevação

O ritmo usa 4/8 dp. Gutter de telefone: 16; telas largas: 24; seções: 24; card: 20; formulários: 16 entre campos; navegação inferior reserva 76 mais safe area. Raios: `small`, `input`, `button`, `card`, `largeCard`, `pill`, `modal`. Elevações: `none`, `subtle`, `card`, `elevated`, `overlay`, `modal`; listas extensas preferem borda em vez de sombra.

### Motion

Tokens públicos: `duration.instant` (0 ms), `duration.press` (100 ms), `duration.fast` (180 ms), `duration.standard` (220 ms), `duration.enter` (260 ms), `duration.route` (320 ms), `easingStandard`, `easingEnter`, `easingExit`, `spring.press`, `spring.gentle`. Saídas são mais curtas que entradas; animações usam transform/opacity, são interrompíveis e chegam imediatamente ao estado final com Reduced Motion. Haptic é reservado a seleção importante, confirmação, sucesso e erro relevante.

### Biblioteca compartilhada

- Estrutura: `Screen`, `AppHeader`, `SectionHeader`, `FormSection`, `Card`, `ElevatedCard`, `ListContainer`, `ListItem`, `MetricCard`, `Divider`.
- Entrada: `Input`, `SearchInput`, `MoneyInput`, `DateInput`, `Select`, `Checkbox`, `Switch`, `SegmentedControl`, `Chip`.
- Ação e status: `Button`, `CompactCreateButton`, `IconButton`, `FloatingAction`, `StatusBadge`.
- Feedback: `EmptyState`, `ErrorState`, `Skeleton`, `Banner`, `Toast`, `Dialog`, `BottomSheet`.

Toda ação compacta tem nome acessível e alvo mínimo de 48 dp. Chips anunciam seleção, switches usam o controle nativo, erros permanecem junto ao campo e status nunca depende apenas de cor.

### Responsividade, dados e acessibilidade

- 320–430 px: uma coluna; títulos e CTAs fazem reflow; valores financeiros não são cortados.
- Tablet/web: largura de leitura limitada; formulários não esticam; métricas podem usar duas colunas.
- Safe areas e teclado: headers, tabs e CTAs fixos reservam os insets e nunca encobrem o foco.
- Dynamic Type: texto cresce sem clipping; badges e valores têm política explícita.
- Web: foco visível, ordem de teclado igual à visual e interação não dependente de hover.
- Gráficos: linha/área para série temporal com quatro ou mais pontos, legenda textual, resumo acessível, valores exatos e estados loading/vazio/erro completos.

## Princípios

1. Humano antes de burocrático: linguagem curta, estados claros e ações previsíveis.
2. Confiança sem aparência bancária: azul profundo contido, âmbar humano e superfícies leves.
3. Inclusão prática: alvos de toque de 48 px, fonte ampliável, contraste AA e status com texto.
4. Movimento com propósito: confirmar causa e efeito, nunca atrasar trabalho ou esconder conteúdo.
5. Densidade móvel saudável: espaço suficiente para leitura sem transformar cada seção em card.

## Identidade

O fundo levemente quente reduz a aparência de painel corporativo. Azul Atlântico representa marca, ação e seleção; âmbar oferece ênfase pontual; verde representa apenas sucesso, resultado positivo e estado ativo. A composição usa títulos fortes, superfícies claras e raios moderados, sem copiar paleta, marca, assets ou composições da Family.

## Tokens

Os tokens ficam em `src/theme` e são semânticos. Componentes devem consumir nomes como `textSecondary`, `successSubtle` e `focusRing`, nunca hexadecimais locais. Espaçamentos seguem múltiplos de 4. Inputs e botões usam raios de 14 px; cards usam 24 px; pills e círculos usam raio total.

As combinações principais foram escolhidas para WCAG AA: grafite sobre fundos claros, branco sobre azul principal, branco sobre vermelho de perigo e textos escuros nos fundos sutis. Status sempre inclui texto, símbolo ou papel acessível.

### Temas

O ResolveMEI oferece `Sistema`, `Claro` e `Escuro`. A escolha é persistida apenas neste dispositivo com AsyncStorage e não integra perfil, API ou Supabase. `Sistema` acompanha `useColorScheme`; as primitives consomem cores semânticas pelo `ThemeProvider`. O tema escuro usa superfícies carvão-azuladas, sem preto absoluto, neon ou linguagem visual de fintech.

## Redesign estrutural v3

| Área         | Estrutura anterior                                    | Estrutura atual                                                                         |
| ------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Autenticação | marca, título e formulário em uma pilha uniforme      | introdução editorial responsiva + coluna de tarefa focada                               |
| Home         | painel financeiro pesado e ações com peso semelhante  | resumo tipográfico com faixa de ênfase + ação primária inequívoca + blocos operacionais |
| Navegação    | ícones e labels comprimidos sobre uma linha divisória | superfície elevada, área de toque estável e cápsula de destino ativo                    |
| Listas       | anatomias próprias por módulo                         | cabeçalho, busca, filtro e trailing content com hierarquia repetível                    |
| Detalhes     | ações e informações em cards genéricos                | cabeçalho de entidade, grupos de informação e confirmação contextual                    |
| Feedback     | alertas do sistema e mensagens textuais               | toast não bloqueante, banner inline, confirmação visual e sucesso animado               |

As superfícies têm papéis explícitos: `default` agrupa conteúdo relacionado; `subtle` organiza sem elevar; `summary` destaca síntese; `interactive` indica navegação; `selected` representa escolha; variantes semânticas comunicam estado. Botões usam `primary`, `secondary`, `outline`, `ghost`, `danger`, `link` e `icon`; seus limites não mudam durante loading.

O Family foi usado somente como referência estratégica de redução de ruído, ação principal evidente, conteúdo protagonista, feedback imediato e consistência de movimento. Não houve cópia de código, assets, paleta, componentes, textos, layouts ou identidade Web3.

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
