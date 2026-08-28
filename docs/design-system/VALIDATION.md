# Matriz de validação do redesign

Esta matriz separa as três camadas exigidas pelo redesign. `Layout` cobre hierarquia, ordem e responsividade; `Composição` cobre quais primitives formam a tela; `Estilo` cobre tokens, temas e estados visuais. A evidência automatizada complementa, mas não substitui, a conferência no aparelho.

| Fluxo                     | Layout     | Composição                                                            | Estilo                                  | Evidência no repositório                   |
| ------------------------- | ---------- | --------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Autenticação e onboarding | preservado | primitives compartilhadas                                             | claro/escuro por tokens                 | testes de auth, onboarding e tema          |
| Home                      | revisado   | saldo, tendência, composição, gráficos e ações rápidas                | identidade índigo e estados semânticos  | testes de dashboard e arquitetura visual   |
| Perfil                    | revisado   | identidade no topo, formulários seccionados e logout isolado          | cards e perigo sem depender só de cor   | testes de perfil e isolamento A-B-A        |
| Clientes                  | preservado | `FlatList`, card interativo e detalhes seccionados                    | badge semântico e chevron estrutural    | testes de lista, navegação e contato       |
| Serviços                  | preservado | `FlatList`, card interativo e detalhes seccionados                    | preço em primary e status semântico     | testes de lista, detalhes e status         |
| Orçamentos                | preservado | um orçamento por item virtualizado; formulário e detalhes seccionados | badges, valores e ações por tokens      | testes de lista visual, domínio e detalhes |
| Catálogo                  | revisado   | Tipografia → Cor → Ícone → Grid → Componentes                         | alternância Sistema/Claro/Escuro        | testes de primitives e tema                |
| Configuração nativa       | preservado | splash e adaptive icon                                                | índigo; `userInterfaceStyle: automatic` | `app.json` e validação Expo                |

## Checklist manual no aparelho

- Reabrir um build compatível com a configuração nativa atual; mudanças em splash/adaptive icon não aparecem por Fast Refresh.
- Conferir Home, Perfil, listas, formulários e detalhes em Claro e Escuro.
- Repetir com fonte ampliada, teclado aberto, Reduced Motion e conteúdo longo.
- Confirmar foco, labels, contraste, toque mínimo e que cor nunca é o único indicador.
- Registrar captura e dispositivo/build usado antes da aprovação visual final.

## Limite da validação automatizada

O gate prova contratos, propriedades dos tokens, renderização e estrutura. Aparência real de fonte, teclado, barras nativas, splash e densidade depende do binário e do aparelho; por isso a aprovação visual final continua sendo um passo manual explícito, sem declarar como vista uma tela que não foi capturada.
