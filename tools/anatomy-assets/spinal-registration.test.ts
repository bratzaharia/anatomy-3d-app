// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  canalProxy,
  createCanalTransfer,
  insideSurface,
  sectionHoles,
  surfaceBounds,
  type CanalAnchor,
  type Surface,
} from "./spinal-registration";

function annularPrism(): Surface {
  const positions: number[] = [],
    indices: number[] = [];
  for (const y of [0, 1])
    for (const r of [0.02, 0.008])
      for (const [x, z] of [
        [-r, -r],
        [r, -r],
        [r, r],
        [-r, r],
      ])
        positions.push(x!, y, z!);
  const quad = (a: number, b: number, c: number, d: number) =>
    indices.push(a, b, c, a, c, d);
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    quad(i, next, next + 8, i + 8);
    quad(i + 4, i + 12, next + 12, next + 4);
    quad(i + 8, next + 8, next + 12, i + 12);
    quad(i, i + 4, next + 4, next);
  }
  return { positions, indices };
}
describe("offline canal geometry screens, not medical annotations", () => {
  it("requires an explicit bounded policy for source-shape-preserving boundary translation", () => {
    const points: CanalAnchor[] = [
      { level: "a", source: [0, 0, 0], target: [0.1, 1, 0.2] },
      { level: "b", source: [0, 1, 0], target: [0.1, 2, 0.2] },
      { level: "c", source: [0, 2, 0], target: [0.1, 3, 0.2] },
    ];
    expect(() => createCanalTransfer(points)([0, -0.002, 0])).toThrow(
      "Outside measured",
    );
    expect(createCanalTransfer(points, 0.003)([0, -0.002, 0])).toEqual([
      0.1, 0.998, 0.2,
    ]);
    expect(() => createCanalTransfer(points, 0.003)([0, -0.004, 0])).toThrow(
      "Outside measured",
    );
    expect(() => createCanalTransfer(points, -1)).toThrow("Invalid boundary");
  });
  it("extracts an actual bounded inner contour rather than the solid outer boundary", () => {
    const holes = sectionHoles(annularPrism(), 0.5);
    expect(holes).toHaveLength(1);
    expect(holes[0]!.area).toBeCloseTo(0.000256, 9);
    expect(holes[0]!.center).toEqual([0, 0.5, 0]);
    expect(canalProxy(annularPrism())!.validSections).toBe(23);
  });
  it("rejects open contours instead of inventing closing edges", () => {
    const mesh = annularPrism();
    const indices = Array.from(mesh.indices).filter((_, i) => i < 6 || i >= 12);
    expect(sectionHoles({ ...mesh, indices }, 0.5)).toEqual([]);
    expect(sectionHoles(mesh, 2)).toEqual([]);
  });
  it("screens mesh interior but leaves the true canal void outside the bone", () => {
    expect(insideSurface([0.015, 0.5, 0], annularPrism())).toBe(true);
    expect(insideSurface([0, 0.5, 0], annularPrism())).toBe(false);
    expect(insideSurface([0.04, 0.5, 0], annularPrism())).toBe(false);
  });
  const anchors: CanalAnchor[] = [
    { level: "a", source: [0, 0, 0], target: [0.1, 1, 0.2] },
    { level: "b", source: [0, 1, 0.1], target: [0.2, 2.2, 0.3] },
    { level: "c", source: [0, 2, 0.2], target: [0.3, 3, 0.4] },
  ];
  it("transfers actual vertices, matching measured anchors while preserving transverse offsets", () => {
    const transfer = createCanalTransfer(anchors);
    for (const anchor of anchors)
      for (let i = 0; i < 3; i++)
        expect(transfer(anchor.source)[i]).toBeCloseTo(anchor.target[i]!, 12);
    const p = transfer([0.005, 1, 0.107]);
    expect(p[0]).toBeCloseTo(0.205);
    expect(p[1]).toBe(2.2);
    expect(p[2]).toBeCloseTo(0.307);
    expect(anchors[0]!.source).toEqual([0, 0, 0]);
  });
  it("refuses extrapolation, inadequate measurements and reversed or duplicate levels", () => {
    expect(() => createCanalTransfer(anchors)([0, -0.1, 0])).toThrow(
      "Outside measured",
    );
    expect(() => createCanalTransfer(anchors)([NaN, 1, 0])).toThrow(
      "Nonfinite",
    );
    expect(() => createCanalTransfer(anchors.slice(0, 2))).toThrow(
      "At least three",
    );
    expect(() =>
      createCanalTransfer([anchors[0]!, anchors[1]!, anchors[1]!]),
    ).toThrow("Non-monotone");
    expect(() =>
      createCanalTransfer(
        anchors.map((a) => ({ ...a, target: [0, -a.target[1], 0] })),
      ),
    ).toThrow("Non-monotone");
    expect(() =>
      surfaceBounds({ positions: [Infinity, 0, 0], indices: [] }),
    ).toThrow("Nonfinite");
  });
});
