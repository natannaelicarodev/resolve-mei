# Tavi — decisões de identidade visual

## Ícone oficial das lojas

**Status:** decisão aprovada para a direção oficial da marca.

O ícone distribuído na App Store e no Google Play é uma exceção deliberada às regras visuais da interface do produto.

### Personagem e composição

**Decisão revisada** — a paleta abaixo substitui a versão anterior deste documento, que usava teal-cyan na roupa e teal escuro `#24556F` no capacete.

- Mascote Tavi em forma de squircle orgânico, com leve inclinação.
- Corpo baseado em teal-cyan claro `#8EC5DE`, mantido.
- Dois olhos verticais em cápsula, sem boca ou outros traços faciais.
- Roupa/uniforme de trabalho em preto/carvão (tom exato a definir com base no arquivo final gerado), substituindo o teal-cyan que estava documentado antes.
- Capacete de segurança em amarelo de segurança tradicional (tom exato a definir com base no arquivo final), com cúpula rígida, nervura e aba horizontal claramente visível — substituindo o teal escuro `#24556F` que estava documentado antes.
- Fundo em grafite azulado com gradiente sutil, de `#121A1F` nas áreas externas/inferiores até aproximadamente `#1C2731` no centro-topo.
- Composição centralizada e protegida pela área segura das máscaras de ícone do iOS e Android.

O capacete amarelo foi escolhido deliberadamente para priorizar o reconhecimento imediato de categoria (trabalho manual/segurança), mesmo divergindo da paleta cromática do restante da marca. O uniforme preto/carvão funciona como neutro de transição entre o amarelo (categoria) e o teal-cyan do corpo (marca).

### Exceção de acabamento premium

Somente o arquivo mestre do ícone para lojas pode utilizar:

- iluminação direcional vinda do canto superior esquerdo;
- profundidade tonal suave no corpo e no capacete;
- sombra coerente na direção inferior direita;
- grão fino e discreto para sensação de material físico;
- arco translúcido de brilho vítreo na região superior;
- gradiente sutil no fundo, de `#121A1F` nas áreas externas/inferiores para aproximadamente `#1C2731` no centro superior.

Esses efeitos fazem parte da apresentação do ícone em vitrines de aplicativos e não alteram os tokens cromáticos principais da marca.

## Regra para a interface e estados do mascote

As telas do Tavi e os estados funcionais do mascote continuam usando cores sólidas, sem gradientes decorativos, brilho vítreo ou textura granulada. Não transportar automaticamente o acabamento premium do ícone de loja para:

- fundos de telas;
- cards, botões ou navegação;
- ilustrações funcionais;
- estados neutro, ativo, atenção, sucesso ou loading do mascote;
- splash screen, salvo por uma decisão futura explícita.

## Proteção contra regressão

Não "corrigir" o ícone oficial para fundo totalmente sólido com o objetivo de igualá-lo à UI. A diferença é intencional: o ícone de loja segue uma convenção visual própria de aquisição e reconhecimento, enquanto a interface privilegia consistência e conforto no uso repetido.

Da mesma forma, não aplicar gradientes à interface apenas para aproximá-la do ícone. Qualquer ampliação dessa exceção exige uma nova decisão documentada.
