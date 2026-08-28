# Referência visual estática

`mockup.html` é **material de design, não código do produto**. É um mockup
HTML/CSS das oito telas principais nos dois temas, usado como referência de
intenção estrutural e nível de acabamento durante o redesign.

Não é executado, importado ou empacotado pelo app. Os valores de cor nele são
aproximações da paleta real: a fonte da verdade é `src/theme/colors.ts`.

Traduções obrigatórias ao aplicar (HTML/CSS -> React Native):

| Mockup (CSS)        | App (React Native)                        |
| ------------------- | ----------------------------------------- |
| `linear-gradient()` | `expo-linear-gradient`                    |
| `box-shadow`        | `getThemeShadows()` (elevation + shadow*) |
| SVG inline          | componente `Icon` (Lucide)                |
| hex literal         | token de `useTheme().colors`              |
| gráfico de área     | `react-native-svg`                        |
