import sharp from 'sharp';
import path from 'node:path';

const input = process.argv[2];
const output = process.argv[3];
const borderOnly = process.argv.includes('--border-only');

if (!input || !output) {
  console.error(
    'Uso: node scripts/remove-background.mjs "entrada.png" "saida.png"',
  );
  process.exit(1);
}

const inputPath = path.resolve(input);
const outputPath = path.resolve(output);

console.log('Lendo imagem original...');

const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({
  resolveWithObject: true,
});

const { width, height, channels } = info;
const totalPixels = width * height;

if (channels !== 4) {
  throw new Error(
    `A imagem precisa possuir 4 canais RGBA. Canais encontrados: ${channels}`,
  );
}

/*
 * Cada pixel classificado como candidato a fundo recebe o valor 1.
 *
 * Os limites foram ajustados para:
 * - reconhecer os dois tons claros do xadrez;
 * - preservar a órbita cinza;
 * - preservar o corpo teal-cyan;
 * - preservar contornos e avatares.
 */
const backgroundCandidate = new Uint8Array(totalPixels);
const visited = new Uint8Array(totalPixels);

function getPixel(index) {
  const offset = index * channels;

  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const alpha = data[offset + 3];

  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);

  return {
    offset,
    red,
    green,
    blue,
    alpha,
    brightness: (red + green + blue) / 3,
    saturation: maximum - minimum,
  };
}

function makeTransparent(index) {
  const offset = index * channels;

  data[offset] = 0;
  data[offset + 1] = 0;
  data[offset + 2] = 0;
  data[offset + 3] = 0;
}

console.log('Classificando os pixels claros do fundo...');

for (let index = 0; index < totalPixels; index++) {
  const { alpha, brightness, saturation } = getPixel(index);

  /*
   * O fundo quadriculado é muito claro e quase sem saturação.
   *
   * A órbita costuma ser mais escura que 228.
   * O teal-cyan possui saturação muito superior a 18.
   */
  const isBackgroundCandidate =
    alpha === 0 || (brightness >= 228 && saturation <= 18);

  if (isBackgroundCandidate) {
    backgroundCandidate[index] = 1;
  }
}

/*
 * Estruturas reutilizadas durante a busca dos componentes.
 */
const queue = new Int32Array(totalPixels);
const componentPixels = new Int32Array(totalPixels);

/*
 * Uma região clara é removida quando:
 *
 * 1. toca uma das bordas do canvas; ou
 * 2. representa uma região muito grande.
 *
 * Isso remove:
 * - o fundo externo;
 * - o fundo preso dentro da órbita circular.
 *
 * E preserva:
 * - o interior branco dos três cartões;
 * - pequenas áreas claras pertencentes à ilustração.
 */
const largeComponentThreshold = Math.floor(totalPixels * 0.03);

console.log('Separando fundo, cartões e elementos claros...');

for (let initialIndex = 0; initialIndex < totalPixels; initialIndex++) {
  if (visited[initialIndex] || backgroundCandidate[initialIndex] === 0) {
    continue;
  }

  let queueStart = 0;
  let queueEnd = 0;
  let componentSize = 0;
  let touchesCanvasBorder = false;

  visited[initialIndex] = 1;
  queue[queueEnd++] = initialIndex;

  while (queueStart < queueEnd) {
    const index = queue[queueStart++];
    componentPixels[componentSize++] = index;

    const x = index % width;
    const y = Math.floor(index / width);

    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
      touchesCanvasBorder = true;
    }

    /*
     * Percorre as oito direções para atravessar corretamente
     * todos os quadrados adjacentes do fundo.
     */
    for (let offsetY = -1; offsetY <= 1; offsetY++) {
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        if (offsetX === 0 && offsetY === 0) {
          continue;
        }

        const nextX = x + offsetX;
        const nextY = y + offsetY;

        if (nextX < 0 || nextY < 0 || nextX >= width || nextY >= height) {
          continue;
        }

        const nextIndex = nextY * width + nextX;

        if (visited[nextIndex] || backgroundCandidate[nextIndex] === 0) {
          continue;
        }

        visited[nextIndex] = 1;
        queue[queueEnd++] = nextIndex;
      }
    }
  }

  const isLargeBackgroundRegion = componentSize >= largeComponentThreshold;

  const shouldRemove =
    touchesCanvasBorder || (!borderOnly && isLargeBackgroundRegion);

  if (shouldRemove) {
    for (let position = 0; position < componentSize; position++) {
      makeTransparent(componentPixels[position]);
    }
  }
}

/*
 * Limpa pequenos pixels quase brancos restantes que estejam
 * diretamente conectados a pixels transparentes.
 *
 * O limite continua alto para não atingir a órbita cinza.
 */
console.log('Limpando resíduos claros nas extremidades...');

const cleanupMask = new Uint8Array(totalPixels);

for (let pass = 0; pass < 2; pass++) {
  cleanupMask.fill(0);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      const pixel = getPixel(index);

      if (pixel.alpha === 0) {
        continue;
      }

      const isVeryLightNeutral =
        pixel.brightness >= 238 && pixel.saturation <= 14;

      if (!isVeryLightNeutral) {
        continue;
      }

      let touchesTransparency = false;

      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        for (let offsetX = -1; offsetX <= 1; offsetX++) {
          if (offsetX === 0 && offsetY === 0) {
            continue;
          }

          const neighborX = x + offsetX;
          const neighborY = y + offsetY;
          const neighborIndex = neighborY * width + neighborX;
          const neighborOffset = neighborIndex * channels;

          if (data[neighborOffset + 3] === 0) {
            touchesTransparency = true;
          }
        }
      }

      if (touchesTransparency) {
        cleanupMask[index] = 1;
      }
    }
  }

  for (let index = 0; index < totalPixels; index++) {
    if (cleanupMask[index]) {
      makeTransparent(index);
    }
  }
}

console.log('Salvando PNG com canal alpha...');

await sharp(data, {
  raw: {
    width,
    height,
    channels,
  },
})
  .png({
    compressionLevel: 9,
    adaptiveFiltering: true,
  })
  .toFile(outputPath);

/*
 * Validação final.
 */
const result = await sharp(outputPath).ensureAlpha().raw().toBuffer();

let alphaMinimo = 255;
let alphaMaximo = 0;
let pixelsTransparentes = 0;
let pixelsOpacos = 0;
let pixelsSemitransparentes = 0;

for (let index = 3; index < result.length; index += 4) {
  const alpha = result[index];

  alphaMinimo = Math.min(alphaMinimo, alpha);
  alphaMaximo = Math.max(alphaMaximo, alpha);

  if (alpha === 0) {
    pixelsTransparentes++;
  } else if (alpha === 255) {
    pixelsOpacos++;
  } else {
    pixelsSemitransparentes++;
  }
}

const transparenciaReal =
  alphaMinimo === 0 &&
  alphaMaximo === 255 &&
  pixelsTransparentes > 0 &&
  pixelsOpacos > 0;

console.log({
  arquivo: output,
  largura: width,
  altura: height,
  alphaMinimo,
  alphaMaximo,
  pixelsTransparentes,
  pixelsOpacos,
  pixelsSemitransparentes,
  transparenciaReal,
});

if (!transparenciaReal) {
  console.warn('Atenção: o resultado não apresentou a transparência esperada.');
}
