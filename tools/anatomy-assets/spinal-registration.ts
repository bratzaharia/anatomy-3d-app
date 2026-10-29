// Offline source geometry measurements only. No anatomical paths are created.
export type Point3 = [number, number, number];
export type Surface = {
  positions: ArrayLike<number>;
  indices: ArrayLike<number>;
};
type Point2 = [number, number];
export type SectionHole = {
  y: number;
  center: Point3;
  area: number;
  polygon: Point2[];
};

export function surfaceBounds(surface: Surface) {
  const min: Point3 = [Infinity, Infinity, Infinity],
    max: Point3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < surface.positions.length; i++) {
    const value = surface.positions[i]!;
    if (!Number.isFinite(value)) throw Error("Nonfinite source coordinate");
    const axis = i % 3;
    min[axis] = Math.min(min[axis]!, value);
    max[axis] = Math.max(max[axis]!, value);
  }
  return { min, max };
}
function inside(point: Point2, polygon: Point2[]) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]!,
      b = polygon[j]!;
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      hit = !hit;
  }
  return hit;
}
function polygonMeasure(polygon: Point2[]) {
  let twiceArea = 0,
    x = 0,
    z = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]!,
      b = polygon[(i + 1) % polygon.length]!;
    const cross = a[0] * b[1] - b[0] * a[1];
    twiceArea += cross;
    x += (a[0] + b[0]) * cross;
    z += (a[1] + b[1]) * cross;
  }
  return {
    area: Math.abs(twiceArea) / 2,
    center: [x / (3 * twiceArea), z / (3 * twiceArea)] as Point2,
  };
}

/** Bounded holes in a real horizontal triangle-mesh cross-section.
 * Open/branched chains are rejected, not closed with invented edges.
 * A detected hole is a geometric proxy, never a medically annotated canal.
 */
export function sectionHoles(
  surface: Surface,
  y: number,
  tolerance = 1e-6,
): SectionHole[] {
  const points: Point2[] = [],
    neighbors: Set<number>[] = [],
    buckets = new Map<string, number[]>();
  const vertex = (p: Point2) => {
    const q = p.map((v) => Math.floor(v / tolerance));
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        for (const id of buckets.get(`${q[0]! + dx},${q[1]! + dz}`) ?? [])
          if (
            Math.hypot(p[0] - points[id]![0], p[1] - points[id]![1]) <=
            tolerance
          )
            return id;
      }
    const id = points.length,
      key = q.join(",");
    points.push(p);
    neighbors.push(new Set());
    buckets.set(key, [...(buckets.get(key) ?? []), id]);
    return id;
  };
  for (let i = 0; i < surface.indices.length; i += 3) {
    const triangle = [0, 1, 2].map((k) => {
      const offset = surface.indices[i + k]! * 3;
      return [
        surface.positions[offset]!,
        surface.positions[offset + 1]!,
        surface.positions[offset + 2]!,
      ] as Point3;
    });
    const intersections: Point2[] = [];
    for (let k = 0; k < 3; k++) {
      const a = triangle[k]!,
        b = triangle[(k + 1) % 3]!;
      // Half-open crossing avoids counting an on-plane vertex twice.
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        const t = (y - a[1]) / (b[1] - a[1]);
        intersections.push([
          a[0] + t * (b[0] - a[0]),
          a[2] + t * (b[2] - a[2]),
        ]);
      }
    }
    if (intersections.length !== 2) continue;
    const a = vertex(intersections[0]!),
      b = vertex(intersections[1]!);
    if (a !== b) {
      neighbors[a]!.add(b);
      neighbors[b]!.add(a);
    }
  }
  const visited = new Set<number>(),
    polygons: Point2[][] = [];
  for (let start = 0; start < points.length; start++) {
    if (visited.has(start)) continue;
    const component: number[] = [],
      pending = [start];
    while (pending.length) {
      const id = pending.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);
      pending.push(...neighbors[id]!);
    }
    if (
      component.length < 3 ||
      component.some((id) => neighbors[id]!.size !== 2)
    )
      continue;
    const loop: Point2[] = [];
    let current = start,
      previous = -1;
    do {
      loop.push(points[current]!);
      const next = [...neighbors[current]!].find((id) => id !== previous)!;
      previous = current;
      current = next;
    } while (current !== start && loop.length <= component.length);
    if (current === start && loop.length === component.length)
      polygons.push(loop);
  }
  const measures = polygons.map(polygonMeasure);
  return polygons.flatMap((polygon, i) => {
    const measure = measures[i]!;
    if (!Number.isFinite(measure.center[0]) || measure.area < 1e-8) return [];
    const depth = polygons.filter(
      (other, j) =>
        j !== i &&
        measures[j]!.area > measure.area &&
        inside(polygon[0]!, other),
    ).length;
    return depth % 2
      ? [
          {
            y,
            center: [measure.center[0], y, measure.center[1]] as Point3,
            area: measure.area,
            polygon,
          },
        ]
      : [];
  });
}

export function canalProxy(surface: Surface) {
  const bounds = surfaceBounds(surface),
    holes: SectionHole[] = [];
  const midline = (bounds.min[0] + bounds.max[0]) / 2;
  for (let i = 1; i <= 23; i++) {
    const y = bounds.min[1] + ((bounds.max[1] - bounds.min[1]) * i) / 24;
    const candidates = sectionHoles(surface, y)
      .filter(
        (hole) =>
          Math.abs(hole.center[0] - midline) < 0.015 &&
          hole.area > 0.00004 &&
          hole.area < 0.002,
      )
      .sort((a, b) => b.area - a.area);
    if (candidates[0]) holes.push(candidates[0]);
  }
  if (!holes.length) return null;
  // Use a real observed section near the median valid height, not a fabricated
  // average centroid that may lie outside all observed canal sections.
  return {
    selected: holes[Math.floor(holes.length / 2)]!,
    sections: holes,
    validSections: holes.length,
    bounds,
  };
}

export type CanalAnchor = { level: string; source: Point3; target: Point3 };
export function createCanalTransfer(
  anchors: CanalAnchor[],
  boundaryTranslationLimit = 0,
) {
  if (
    !Number.isFinite(boundaryTranslationLimit) ||
    boundaryTranslationLimit < 0
  )
    throw Error("Invalid boundary translation limit");
  if (anchors.length < 3)
    throw Error("At least three measured correspondences required");
  const sorted = [...anchors].sort((a, b) => a.source[1] - b.source[1]);
  for (let i = 1; i < sorted.length; i++)
    if (
      sorted[i]!.source[1] <= sorted[i - 1]!.source[1] ||
      sorted[i]!.target[1] <= sorted[i - 1]!.target[1]
    )
      throw Error("Non-monotone canal correspondence");
  return (point: Point3): Point3 => {
    if (!point.every(Number.isFinite)) throw Error("Nonfinite transfer input");
    // Do not silently extrapolate beyond measured reference coverage.
    if (
      point[1] < sorted[0]!.source[1] ||
      point[1] > sorted.at(-1)!.source[1]
    ) {
      const boundary =
        point[1] < sorted[0]!.source[1] ? sorted[0]! : sorted.at(-1)!;
      if (Math.abs(point[1] - boundary.source[1]) > boundaryTranslationLimit)
        throw Error("Outside measured canal coverage");
      // Explicit candidate policy: preserve source shape with constant
      // displacement, not an extrapolated centerline or radius rescaling.
      return point.map(
        (v, k) => v + boundary.target[k]! - boundary.source[k]!,
      ) as Point3;
    }
    let index = sorted.findIndex((a) => a.source[1] >= point[1]);
    index = Math.max(1, index);
    const a = sorted[index - 1]!,
      b = sorted[index]!;
    const t = (point[1] - a.source[1]) / (b.source[1] - a.source[1]);
    const s = a.source.map((v, k) => v + t * (b.source[k]! - v));
    const target = a.target.map((v, k) => v + t * (b.target[k]! - v));
    // Preserve transverse dimensions; no radius inflation or synthetic course.
    return [
      point[0] - s[0]! + target[0]!,
      target[1]!,
      point[2] - s[2]! + target[2]!,
    ];
  };
}

/** Odd/even ray along +X, deduplicating edge/vertex hits. Mesh solidity must be
 * reviewed separately; this is an intersection screen, not a clinical test. */
export function insideSurface(point: Point3, surface: Surface) {
  const hits: number[] = [],
    [px, py, pz] = point;
  for (let i = 0; i < surface.indices.length; i += 3) {
    const a = surface.indices[i]! * 3,
      b = surface.indices[i + 1]! * 3,
      c = surface.indices[i + 2]! * 3,
      p = surface.positions;
    const ay = p[a + 1]!,
      az = p[a + 2]!,
      by = p[b + 1]!,
      bz = p[b + 2]!,
      cy = p[c + 1]!,
      cz = p[c + 2]!;
    if (
      py < Math.min(ay, by, cy) ||
      py > Math.max(ay, by, cy) ||
      pz < Math.min(az, bz, cz) ||
      pz > Math.max(az, bz, cz)
    )
      continue;
    const den = (bz - cz) * (ay - cy) + (cy - by) * (az - cz);
    if (Math.abs(den) < 1e-14) continue;
    const u = ((bz - cz) * (py - cy) + (cy - by) * (pz - cz)) / den;
    const v = ((cz - az) * (py - cy) + (ay - cy) * (pz - cz)) / den;
    if (u < -1e-9 || v < -1e-9 || u + v > 1 + 1e-9) continue;
    const x = u * p[a]! + v * p[b]! + (1 - u - v) * p[c]!;
    if (x > px + 1e-7) hits.push(x);
  }
  hits.sort((a, b) => a - b);
  return (
    hits.filter((x, i) => i === 0 || x - hits[i - 1]! > 1e-6).length % 2 === 1
  );
}
