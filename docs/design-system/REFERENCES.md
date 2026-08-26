# Referências e decisões

## Fontes analisadas

- Family: https://family.co/
- ConnectKit: https://github.com/family/connectkit
- Commit: `025b3f4b643e9bb8828d63fcbd068f182b64f60b`
- Licença: BSD-2-Clause, Copyright 2022 LFE, Inc.
- Expo Font SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/font/
- Expo Haptics SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/haptics/

## Matriz de padrões

| Padrão              | Arquivo/origem                          | Comportamento                             | Tecnologia original             | Utilidade   | Compatibilidade RN | Decisão                   | Justificativa                                 |
| ------------------- | --------------------------------------- | ----------------------------------------- | ------------------------------- | ----------- | ------------------ | ------------------------- | --------------------------------------------- |
| Hierarquia amigável | `family.co`                             | Títulos claros, espaço e mensagens curtas | Web                             | Alta        | Conceitual         | Recriar                   | Filosofia adequada, identidade própria        |
| Tokens de tema      | `src/styles/index.ts`, `themes/base.ts` | Variáveis globais e temas                 | CSS variables/styled-components | Alta        | Não direta         | Recriar                   | Objetos TypeScript sem CSS/DOM                |
| Botão responsivo    | `Common/Button`, `ThemedButton`         | Pressão, loading e estados                | React DOM/CSS                   | Alta        | Parcial            | Recriar                   | Pressable e Animated nativos                  |
| Container dinâmico  | `Common/DynamicContainer`               | Mantém transições estáveis                | DOM/Framer Motion               | Alta        | Parcial            | Adaptar comportamento     | `StepTransition` com container RN estável     |
| Modal responsivo    | `Common/Modal`                          | Etapas, back, overlay e foco              | DOM, portal, focus trap         | Futura      | Baixa              | Descartar nesta etapa     | Modal não é requisito real atual              |
| Reduced motion      | `styles/index.ts`                       | Reduz duração via media query             | CSS media query                 | Alta        | Conceitual         | Recriar                   | AccessibilityInfo do React Native             |
| Spinner/skeleton    | `Common/Spinner`, ConnectorList         | Feedback durante espera                   | CSS keyframes                   | Alta        | Parcial            | Recriar                   | Spinner nativo e pulsação leve                |
| Feedback de erro    | `Common/Alert`, Modal                   | Mensagem visível durante fluxo            | React/CSS                       | Alta        | Parcial            | Recriar                   | InlineFeedback acessível                      |
| Transição de etapas | `Common/Modal` e Pages                  | Direção e continuidade                    | Framer Motion/CSS               | Alta        | Parcial            | Recriar                   | Animated nativo, sem bloquear interação       |
| Scroll contextual   | `Common/ScrollArea`                     | Indica overflow e mantém superfície       | DOM/CSS                         | Média       | Baixa              | Adaptar princípio         | ScrollView/FlatList nativos                   |
| Focus trap          | `useFocusTrap.tsx`                      | Mantém teclado no modal                   | APIs do navegador               | Baixa agora | Não                | Descartar                 | Sem modal nesta etapa; RN usa foco acessível  |
| Responsividade      | `useIsMobile`, `useWindowSize`          | Layout por viewport                       | window/DOM                      | Média       | Não direta         | Recriar quando necessário | RN Dimensions e constraints, sem copiar hooks |
| Fonte remota        | `useGoogleFont.tsx`                     | Injeta Google Fonts                       | DOM link tags                   | Média       | Não                | Descartar                 | Fonte empacotada via Expo                     |
| QR/Web3/conectores  | componentes e hooks                     | Conexão de carteiras                      | wagmi/viem/DOM                  | Nenhuma     | Não                | Descartar                 | Fora do produto e proibido pelo escopo        |

## Licença e atribuição

Nenhum trecho de código, CSS, asset, texto ou composição do ConnectKit/Family foi copiado ou adaptado. A implementação foi escrita do zero com React Native e APIs Expo, baseada apenas em observação comportamental. Por isso não foi criado `THIRD_PARTY_NOTICES.md`; inventar atribuição de código inexistente seria incorreto.

Manrope é distribuída sob SIL Open Font License 1.1. O texto da licença acompanha a dependência instalada em `node_modules/@expo-google-fonts/manrope/LICENSE_FONT`; não foram incorporados arquivos manualmente fora do pacote.
