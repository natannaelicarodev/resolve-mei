# Auditoria da interface existente

## Resumo

A base anterior era consistente e funcional, porém mínima. A paleta tinha 12 valores, a escala de espaçamento tinha cinco níveis e os raios terminavam em 8 px. Tipografia usava fonte do sistema e quatro variantes. Estados de foco, sucesso, ajuda, contador, read-only, reduced motion e haptics não possuíam primitives compartilhadas.

## Achados

| Área           | Origem                    | Achado                                                          | Decisão da Etapa 1                                        |
| -------------- | ------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| Cores          | `src/theme/index.ts`      | Poucos papéis semânticos; sucesso reutilizava primary           | Criar paleta semântica tipada e manter aliases            |
| Espaçamento    | tema e telas              | Escala curta; estilos locais repetiam gaps e margens            | Adotar escala de 4 a 64                                   |
| Tipografia     | `Text.tsx`                | Quatro variantes e fonte do sistema                             | Adicionar Manrope e variantes por função                  |
| Botão          | `Button.tsx`              | Duas variantes; loading removia conteúdo visualmente            | Quatro variantes, três tamanhos e largura interna estável |
| Input          | `Input.tsx`               | Sem foco visual, ajuda, contador ou reserva de erro             | Ampliar API sem quebrar label/error existentes            |
| Card           | `Card.tsx`                | Um estilo elevado aplicado a todos os usos                      | Variantes semânticas e interação opcional                 |
| Screen         | `Screen.tsx`              | Sempre `ScrollView`; teclado sem opção explícita                | Scroll e keyboard avoiding configuráveis                  |
| Feedback       | telas                     | Erro e sucesso implementados com `Text` local                   | Criar `InlineFeedback` e `SuccessTransition`              |
| Loading        | `LoadingScreen.tsx`       | Apenas spinner de tela                                          | Adicionar skeleton estável para conteúdo parcial          |
| Navegação      | layouts Expo Router       | Guards claros e fluxo protegido validado                        | Preservar integralmente                                   |
| Formulários    | auth, onboarding e perfil | React Hook Form consistente; estilos de erro duplicados         | Não redesenhar; migrar gradualmente na Etapa 2            |
| Scroll         | formulários               | `Screen` resolve conteúdo curto, mas não listas futuras         | Documentar FlatList/SectionList e limites                 |
| Teclado        | formulários               | Persistência de toque configurada; sem primitive de avoidance   | Adicionar opção sem alterar telas atuais                  |
| Acessibilidade | UI base                   | Roles básicas presentes; status ainda dependia de cor em pontos | Adicionar labels, live regions, símbolos e alvos mínimos  |
| Motion         | projeto                   | Reanimated instalado, sem primitives                            | Criar somente quatro primitives de uso previsto           |

## Duplicações e rigidez

As telas repetem `styles.error`, `styles.success`, links verdes e cabeçalhos com gaps próprios. `BusinessFormFields` agrupa blocos corretamente, mas o botão é usado como controle segmentado; esse padrão será redesenhado na Etapa 2. O catálogo valida a nova base sem mudar autenticação, onboarding, home, perfil, guards ou regras de negócio.

## Acessibilidade e risco

Os controles existentes já usavam roles e estados básicos. A fundação acrescenta alvos mínimos, foco visível, labels obrigatórios em botões de ícone, reserva de mensagens e Reduced Motion. A validação visual final de sombra/elevation, teclado e fonte ampliada exige Android físico.
