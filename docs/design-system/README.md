# Design system ResolveMEI

## Princípios

1. Humano antes de burocrático: linguagem curta, estados claros e ações previsíveis.
2. Confiança sem aparência bancária: verde funcional, grafite suave e superfícies leves.
3. Inclusão prática: alvos de toque de 44 px, fonte ampliável, contraste AA e status com texto.
4. Movimento com propósito: confirmar causa e efeito, nunca atrasar trabalho ou esconder conteúdo.
5. Densidade móvel saudável: espaço suficiente para leitura sem transformar cada seção em card.

## Identidade

O fundo levemente quente reduz a aparência de painel corporativo. O verde representa ação e progresso; azul, amarelo e coral são acentos limitados para informação, atenção e ênfase. A composição usa títulos fortes, superfícies brancas e raios amigáveis, sem copiar paleta, marca, assets ou composições da Family.

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
