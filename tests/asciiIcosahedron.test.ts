/**
 * Geometry and rasteriser guards for InteractiveAsciiIcosahedronCore.
 *
 * The component draws itself with pure maths, so a mistake in the vertex table
 * or the fill rule shows up as a subtly wrong shape rather than an error. These
 * tests pin the properties that make it an icosahedron at all.
 */

const PHI = (1 + Math.sqrt(5)) / 2;

type Vec3 = readonly [number, number, number];

/** Mirrors the component's vertex construction. */
function buildVertices(): Vec3[] {
  const raw: [number, number, number][] = [];
  for (const s1 of [1, -1])
    for (const s2 of [1, -1]) {
      raw.push([0, s1, s2 * PHI]);
      raw.push([s1, s2 * PHI, 0]);
      raw.push([s1 * PHI, 0, s2]);
    }
  const norm = Math.hypot(1, PHI);
  return raw.map(
    ([x, y, z]) => [x / norm, y / norm, z / norm] as const,
  ) as Vec3[];
}

const distance = (a: Vec3, b: Vec3) =>
  Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Mirrors the component's face derivation, including outward orientation. */
function buildFaces(
  vertices: Vec3[],
  orient = true,
): [number, number, number][] {
  let edge = Infinity;
  for (let i = 0; i < vertices.length; i += 1)
    for (let j = i + 1; j < vertices.length; j += 1) {
      const d = distance(vertices[i]!, vertices[j]!);
      if (d < edge) edge = d;
    }
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
  const faces: [number, number, number][] = [];
  for (let i = 0; i < vertices.length; i += 1)
    for (let j = i + 1; j < vertices.length; j += 1) {
      if (!near(distance(vertices[i]!, vertices[j]!), edge)) continue;
      for (let k = j + 1; k < vertices.length; k += 1) {
        if (!near(distance(vertices[j]!, vertices[k]!), edge)) continue;
        if (!near(distance(vertices[i]!, vertices[k]!), edge)) continue;
        faces.push([i, j, k]);
      }
    }
  if (!orient) return faces;
  return faces.map(([a, b, c]) => {
    const n = faceNormal(vertices, a, b, c);
    const A = vertices[a]!;
    const B = vertices[b]!;
    const C = vertices[c]!;
    const cen: Vec3 = [
      (A[0] + B[0] + C[0]) / 3,
      (A[1] + B[1] + C[1]) / 3,
      (A[2] + B[2] + C[2]) / 3,
    ];
    const outward = n[0] * cen[0] + n[1] * cen[1] + n[2] * cen[2];
    return outward < 0 ? [a, c, b] : [a, b, c];
  });
}

function faceNormal(vertices: Vec3[], a: number, b: number, c: number): Vec3 {
  const A = vertices[a]!;
  const B = vertices[b]!;
  const C = vertices[c]!;
  const e1 = [B[0] - A[0], B[1] - A[1], B[2] - A[2]] as const;
  const e2 = [C[0] - A[0], C[1] - A[1], C[2] - A[2]] as const;
  return [
    e1[1] * e2[2] - e1[2] * e2[1],
    e1[2] * e2[0] - e1[0] * e2[2],
    e1[0] * e2[1] - e1[1] * e2[0],
  ] as const;
}

/** Counts faces that survive back-face culling at a given rotation. */
function visibleFaces(
  vertices: Vec3[],
  faces: [number, number, number][],
  rotX: number,
  rotY: number,
): number {
  const cx = Math.cos(rotX);
  const sx = Math.sin(rotX);
  const cy = Math.cos(rotY);
  const sy = Math.sin(rotY);
  const px: number[] = [];
  const py: number[] = [];
  for (let i = 0; i < vertices.length; i += 1) {
    const v = vertices[i]!;
    const y1 = v[1] * cx - v[2] * sx;
    const z1 = v[1] * sx + v[2] * cx;
    px[i] = v[0] * cy + z1 * sy;
    py[i] = y1 * 0.52;
  }
  let count = 0;
  for (const [a, b, c] of faces) {
    const area =
      (px[b]! - px[a]!) * (py[c]! - py[a]!) -
      (px[c]! - px[a]!) * (py[b]! - py[a]!);
    if (area > 0) count += 1;
  }
  return count;
}

const vertices = buildVertices();
const faces = buildFaces(vertices);

describe('icosahedron geometry', () => {
  it('has exactly twelve vertices and twenty faces', () => {
    expect(vertices).toHaveLength(12);
    expect(faces).toHaveLength(20);
  });

  it('places every vertex on the unit sphere', () => {
    for (const v of vertices)
      expect(Math.hypot(v[0], v[1], v[2])).toBeCloseTo(1, 10);
  });

  it('gives every vertex exactly five neighbours', () => {
    // Five faces meet at each vertex of a regular icosahedron; a vertex with a
    // different count means the solid has a hole or a doubled face.
    const touching = new Array<number>(12).fill(0);
    for (const [a, b, c] of faces) {
      touching[a] = (touching[a] ?? 0) + 1;
      touching[b] = (touching[b] ?? 0) + 1;
      touching[c] = (touching[c] ?? 0) + 1;
    }
    expect(touching).toEqual(new Array<number>(12).fill(5));
  });

  it('makes every face equilateral', () => {
    let edge = Infinity;
    for (let i = 0; i < vertices.length; i += 1)
      for (let j = i + 1; j < vertices.length; j += 1)
        edge = Math.min(edge, distance(vertices[i]!, vertices[j]!));

    for (const [a, b, c] of faces) {
      expect(distance(vertices[a]!, vertices[b]!)).toBeCloseTo(edge, 9);
      expect(distance(vertices[b]!, vertices[c]!)).toBeCloseTo(edge, 9);
      expect(distance(vertices[a]!, vertices[c]!)).toBeCloseTo(edge, 9);
    }
  });

  it('lists each face only once', () => {
    const keys = faces.map((f) => [...f].sort((x, y) => x - y).join('-'));
    expect(new Set(keys).size).toBe(20);
  });

  it('satisfies Euler: V - E + F = 2', () => {
    const edges = new Set<string>();
    for (const [a, b, c] of faces)
      for (const [x, y] of [
        [a, b],
        [b, c],
        [a, c],
      ]) {
        edges.add([x, y].sort((p, q) => p! - q!).join('-'));
      }
    expect(edges.size).toBe(30);
    expect(vertices.length - edges.size + faces.length).toBe(2);
  });
});

describe('face orientation', () => {
  it('points every face normal away from the centre', () => {
    for (const [a, b, c] of faces) {
      const n = faceNormal(vertices, a, b, c);
      const A = vertices[a]!;
      const B = vertices[b]!;
      const C = vertices[c]!;
      const cen = [
        (A[0] + B[0] + C[0]) / 3,
        (A[1] + B[1] + C[1]) / 3,
        (A[2] + B[2] + C[2]) / 3,
      ] as const;
      expect(n[0] * cen[0] + n[1] * cen[1] + n[2] * cen[2]).toBeGreaterThan(0);
    }
  });

  it('shows half the faces from essentially every viewpoint', () => {
    // A convex solid presents half its faces. It can dip below ten only when
    // faces land exactly edge-on and their projected area collapses to zero —
    // a measure-zero set of angles. Anything above ten, at any angle, means
    // inconsistent winding, which is what punches holes through the shape.
    let exact = 0;
    let total = 0;
    for (let rx = 0; rx < Math.PI * 2; rx += 0.37)
      for (let ry = 0; ry < Math.PI * 2; ry += 0.37) {
        const seen = visibleFaces(vertices, faces, rx, ry);
        expect(seen).toBeLessThanOrEqual(10);
        total += 1;
        if (seen === 10) exact += 1;
      }
    // Degenerate angles are rare; the overwhelming majority must be exact.
    expect(exact / total).toBeGreaterThan(0.97);
  });

  it('reproduces the bug when faces are left unoriented', () => {
    // Guards the fix itself: without the orientation pass the count drifts off
    // ten, which is exactly the defect this pass exists to remove.
    const unoriented = buildFaces(vertices, false);
    const counts = new Set<number>();
    for (let rx = 0; rx < Math.PI * 2; rx += 0.37)
      for (let ry = 0; ry < Math.PI * 2; ry += 0.37)
        counts.add(visibleFaces(vertices, unoriented, rx, ry));
    expect(counts.size).toBeGreaterThan(1);
    expect([...counts].some((n) => n !== 10)).toBe(true);
  });
});

describe('character ramp', () => {
  // Must stay byte-identical to the component's ramp, including the leading
  // U+00A0.
  const RAMP = ' .:-=+*#%@';

  it('pads empty cells with a no-break space, not a plain one', () => {
    // Text layout collapses and trims runs of U+0020, so a plain space would
    // shift each row by a different amount and make the solid jitter sideways
    // as it turns. U+00A0 always occupies its cell.
    expect(RAMP.codePointAt(0)).toBe(0x00a0);
    expect(RAMP[0]).not.toBe(' ');
  });

  it('reads as blank while still occupying space', () => {
    expect(RAMP[0]!.trim()).toBe('');
  });

  it('never assigns blank to a lit face', () => {
    // The component computes `1 + round(lit * (RAMP_MAX - 1))`, so even a face
    // fully turned from the light lands on index 1, never on space.
    const RAMP_MAX = RAMP.length - 1;
    for (const lambert of [-1, -0.5, 0, 0.5, 1]) {
      const lit = 0.18 + 0.82 * (lambert > 0 ? lambert : 0);
      const shade = 1 + Math.round(lit * (RAMP_MAX - 1));
      expect(shade).toBeGreaterThanOrEqual(1);
      expect(shade).toBeLessThanOrEqual(RAMP_MAX);
      expect(RAMP[shade]).not.toBe(' ');
    }
  });

  it('brightens monotonically with the light term', () => {
    const RAMP_MAX = RAMP.length - 1;
    const shadeFor = (lambert: number) => {
      const lit = 0.18 + 0.82 * (lambert > 0 ? lambert : 0);
      return 1 + Math.round(lit * (RAMP_MAX - 1));
    };
    expect(shadeFor(1)).toBeGreaterThan(shadeFor(0.5));
    expect(shadeFor(0.5)).toBeGreaterThan(shadeFor(0));
  });
});

describe('colour gradient', () => {
  const EMERALD = [0x00, 0xf5, 0x9b] as const;
  const CHAMPAGNE = [0xe2, 0xb5, 0x7a] as const;
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  const gradient = (t: number) => {
    const k = t < 0 ? 0 : t > 1 ? 1 : t;
    const r = Math.round(CHAMPAGNE[0] + (EMERALD[0] - CHAMPAGNE[0]) * k);
    const g = Math.round(CHAMPAGNE[1] + (EMERALD[1] - CHAMPAGNE[1]) * k);
    const b = Math.round(CHAMPAGNE[2] + (EMERALD[2] - CHAMPAGNE[2]) * k);
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  };

  it('hits both brand endpoints exactly', () => {
    expect(gradient(1)).toBe('#00f59b');
    expect(gradient(0)).toBe('#e2b57a');
  });

  it('clamps outside the unit range instead of producing invalid colour', () => {
    expect(gradient(-3)).toBe('#e2b57a');
    expect(gradient(9)).toBe('#00f59b');
  });

  it('always emits a well-formed six-digit hex colour', () => {
    for (let t = 0; t <= 1.0001; t += 0.05)
      expect(gradient(t)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
