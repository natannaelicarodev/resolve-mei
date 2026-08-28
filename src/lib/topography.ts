type Point = [number, number];

export interface TopographicLevel {
  level: number;
  paths: string[];
}

export interface TopographicOptions {
  width: number;
  height: number;
  seed?: number;
  levels?: number;
  cellSize?: number;
  octaves?: number;
  persistence?: number;
  noiseScale?: number;
  minLength?: number;
}

function createNoise2D(seed: number) {
  function hash(x: number, y: number): number {
    let h = seed + x * 374761393 + y * 668265263;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return ((h >>> 0) % 100000) / 100000;
  }
  function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }
  function valueAt(x: number, y: number): number {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const sx = smoothstep(x - x0);
    const sy = smoothstep(y - y0);
    const n00 = hash(x0, y0);
    const n10 = hash(x0 + 1, y0);
    const n01 = hash(x0, y0 + 1);
    const n11 = hash(x0 + 1, y0 + 1);
    const ix0 = n00 + (n10 - n00) * sx;
    const ix1 = n01 + (n11 - n01) * sx;
    return ix0 + (ix1 - ix0) * sy;
  }
  return function noise2D(
    x: number,
    y: number,
    octaves: number,
    persistence: number,
  ): number {
    let total = 0;
    let freq = 1;
    let amp = 1;
    let maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      total += valueAt(x * freq, y * freq) * amp;
      maxAmp += amp;
      amp *= persistence;
      freq *= 2;
    }
    return total / maxAmp;
  };
}

function buildField(
  cols: number,
  rows: number,
  sample: (x: number, y: number, octaves: number, persistence: number) => number,
  scale: number,
  octaves: number,
  persistence: number,
): number[][] {
  const field: number[][] = [];
  for (let j = 0; j <= rows; j++) {
    const row: number[] = [];
    for (let i = 0; i <= cols; i++) {
      row.push(sample(i * scale, j * scale, octaves, persistence));
    }
    field.push(row);
  }
  return field;
}

function interp(
  p1: number,
  p2: number,
  v1: number,
  v2: number,
  threshold: number,
): number {
  if (Math.abs(v1 - v2) < 1e-6) return (p1 + p2) / 2;
  return p1 + ((threshold - v1) / (v2 - v1)) * (p2 - p1);
}

/** Marching squares: extracts unordered line segments for a scalar field at a given threshold. */
function marchingSquares(
  field: number[][],
  cols: number,
  rows: number,
  threshold: number,
  cellSize: number,
): [Point, Point][] {
  const segments: [Point, Point][] = [];
  for (let j = 0; j < rows; j++) {
    const rowTop = field[j]!;
    const rowBottom = field[j + 1]!;
    for (let i = 0; i < cols; i++) {
      const tl = rowTop[i]!;
      const tr = rowTop[i + 1]!;
      const br = rowBottom[i + 1]!;
      const bl = rowBottom[i]!;
      let caseIndex = 0;
      if (tl >= threshold) caseIndex |= 8;
      if (tr >= threshold) caseIndex |= 4;
      if (br >= threshold) caseIndex |= 2;
      if (bl >= threshold) caseIndex |= 1;
      if (caseIndex === 0 || caseIndex === 15) continue;

      const x0 = i * cellSize;
      const x1 = (i + 1) * cellSize;
      const y0 = j * cellSize;
      const y1 = (j + 1) * cellSize;

      const top: Point = [interp(x0, x1, tl, tr, threshold), y0];
      const right: Point = [x1, interp(y0, y1, tr, br, threshold)];
      const bottom: Point = [interp(x0, x1, bl, br, threshold), y1];
      const left: Point = [x0, interp(y0, y1, tl, bl, threshold)];
      const center = (tl + tr + br + bl) / 4;

      switch (caseIndex) {
        case 1:
          segments.push([left, bottom]);
          break;
        case 2:
          segments.push([bottom, right]);
          break;
        case 3:
          segments.push([left, right]);
          break;
        case 4:
          segments.push([top, right]);
          break;
        case 5:
          if (center >= threshold) {
            segments.push([left, top], [bottom, right]);
          } else {
            segments.push([left, bottom], [top, right]);
          }
          break;
        case 6:
          segments.push([top, bottom]);
          break;
        case 7:
          segments.push([left, top]);
          break;
        case 8:
          segments.push([left, top]);
          break;
        case 9:
          segments.push([top, bottom]);
          break;
        case 10:
          if (center >= threshold) {
            segments.push([left, bottom], [top, right]);
          } else {
            segments.push([left, top], [bottom, right]);
          }
          break;
        case 11:
          segments.push([top, right]);
          break;
        case 12:
          segments.push([left, right]);
          break;
        case 13:
          segments.push([bottom, right]);
          break;
        case 14:
          segments.push([left, bottom]);
          break;
        default:
          break;
      }
    }
  }
  return segments;
}

function keyOf(p: Point): string {
  return `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
}

/** Joins the unordered marching-squares segments into continuous polylines. */
function chainSegments(segments: [Point, Point][]): Point[][] {
  const adjacency = new Map<string, { point: Point; segIdx: number }[]>();
  segments.forEach(([a, b], idx) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (!adjacency.has(ka)) adjacency.set(ka, []);
    if (!adjacency.has(kb)) adjacency.set(kb, []);
    adjacency.get(ka)!.push({ point: b, segIdx: idx });
    adjacency.get(kb)!.push({ point: a, segIdx: idx });
  });

  const used = new Array(segments.length).fill(false);
  const polylines: Point[][] = [];

  for (let i = 0; i < segments.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const [a, b] = segments[i]!;
    const chain: Point[] = [a, b];

    let extended = true;
    while (extended) {
      extended = false;
      const neighbors = adjacency.get(keyOf(chain[chain.length - 1]!)) ?? [];
      for (const n of neighbors) {
        if (!used[n.segIdx]) {
          used[n.segIdx] = true;
          chain.push(n.point);
          extended = true;
          break;
        }
      }
    }
    extended = true;
    while (extended) {
      extended = false;
      const neighbors = adjacency.get(keyOf(chain[0]!)) ?? [];
      for (const n of neighbors) {
        if (!used[n.segIdx]) {
          used[n.segIdx] = true;
          chain.unshift(n.point);
          extended = true;
          break;
        }
      }
    }
    polylines.push(chain);
  }
  return polylines;
}

function pathLength(points: Point[]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const curr = points[i]!;
    const prev = points[i - 1]!;
    len += Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
  }
  return len;
}

function isClosed(points: Point[], eps: number): boolean {
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return Math.hypot(first[0] - last[0], first[1] - last[1]) < eps;
}

/** Uniform Catmull-Rom to cubic-bezier conversion, producing a smooth SVG path. */
function toSmoothPath(points: Point[], closed: boolean): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    const [p0, p1] = points as [Point, Point];
    return `M${p0[0].toFixed(2)},${p0[1].toFixed(2)} L${p1[0].toFixed(2)},${p1[1].toFixed(2)}`;
  }
  const pts = closed ? points.slice(0, -1) : points;
  const n = pts.length;
  const get = (i: number): Point =>
    closed ? pts[(i + n) % n]! : pts[Math.min(Math.max(i, 0), n - 1)]!;

  const start = pts[0]!;
  let d = `M${start[0].toFixed(2)},${start[1].toFixed(2)}`;
  const segCount = closed ? n : n - 1;
  for (let i = 0; i < segCount; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return closed ? `${d} Z` : d;
}

/**
 * Generates nested contour-line levels from a 2D noise field (topographic map style),
 * via marching squares + Catmull-Rom smoothing. Pure and deterministic for a given seed,
 * so callers can cache the result instead of recomputing it on every render.
 */
export function generateTopographicLevels({
  width,
  height,
  seed = 1,
  levels = 6,
  cellSize = 14,
  octaves = 3,
  persistence = 0.5,
  noiseScale = 0.1,
  minLength = 30,
}: TopographicOptions): TopographicLevel[] {
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const noise2D = createNoise2D(seed);
  const field = buildField(cols, rows, noise2D, noiseScale, octaves, persistence);

  let min = Infinity;
  let max = -Infinity;
  for (const row of field) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  const range = max - min || 1;
  // Only contour the upper part of the field, so islands stay isolated with
  // breathing room between clusters instead of covering the canvas evenly.
  const lo = min + range * 0.52;
  const hi = min + range * 0.88;

  const result: TopographicLevel[] = [];
  for (let lvl = 0; lvl < levels; lvl++) {
    const t = levels === 1 ? 0 : lvl / (levels - 1);
    const threshold = lo + (hi - lo) * t;
    const segments = marchingSquares(field, cols, rows, threshold, cellSize);
    const polylines = chainSegments(segments);
    const paths: string[] = [];
    for (const poly of polylines) {
      if (poly.length < 3) continue;
      if (pathLength(poly) < minLength) continue;
      paths.push(toSmoothPath(poly, isClosed(poly, cellSize * 0.75)));
    }
    result.push({ level: lvl, paths });
  }
  return result;
}
