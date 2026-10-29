// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  parseExfGroups,
  parseRanges,
  spinalSourcePairs,
  serializeRanges,
  type ExfGroup,
} from "./spinal-source-inventory";
describe("research spinal source identity audit", () => {
  it("parses bounded ranges and rejects malformed or unbounded inputs", () => {
    expect([...parseRanges("1..3,5\n7..8")]).toEqual([1, 2, 3, 5, 7, 8]);
    expect(serializeRanges([8, 7, 1, 2, 3, 5, 5])).toBe("1..3,5,7..8");
    expect([...parseRanges(serializeRanges([1, 3, 4, 9]))]).toEqual([
      1, 3, 4, 9,
    ]);
    for (const invalid of ["4..1", "0", "1..1000001", "1-3", "x"])
      expect(() => parseRanges(invalid)).toThrow();
  });
  it("separates 3D membership from similarly numbered 1D/2D elements", () => {
    const groups = parseExfGroups(
      "EX Version: 3\nGroup name: left\n!#nodeset nodes\nNode group:\n1..4\n!#mesh mesh1d, dimension=1\nElement group:\n1..9\n!#mesh mesh2d, dimension=2\nElement group:\n1..8\n!#mesh mesh3d, dimension=3\nElement group:\n21..23\n",
    );
    expect([...groups.get("left")!.nodes]).toEqual([1, 2, 3, 4]);
    expect([...groups.get("left")!.volumes]).toEqual([21, 22, 23]);
    expect(() => parseExfGroups("EX Version: 2")).toThrow();
    expect(() =>
      parseExfGroups("EX Version: 3\nGroup name: left\nGroup name: left\n"),
    ).toThrow("Duplicate");
  });
  function fixture() {
    const groups = new Map<string, ExfGroup>();
    const levels = [
      ...Array.from({ length: 8 }, (_, i) => `C${i + 1}`),
      ...Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
      ...Array.from({ length: 5 }, (_, i) => `L${i + 1}`),
      ...Array.from({ length: 5 }, (_, i) => `S${i + 1}`),
      "Co1",
    ];
    for (const side of ["left", "right"])
      groups.set(side, { nodes: new Set(), volumes: new Set() });
    levels.forEach((level, i) => {
      const a = 2 * i + 1,
        b = a + 1;
      groups.set(
        level === "Co1" ? "coccygeal nerve" : `${level} spinal nerve`,
        { nodes: new Set([a, b]), volumes: new Set([a, b]) },
      );
      groups.get("left")!.nodes.add(a);
      groups.get("left")!.volumes.add(a);
      groups.get("right")!.nodes.add(b);
      groups.get("right")!.volumes.add(b);
    });
    return groups;
  }
  it("resolves 31 named source pairs to 62 stable IDs without creating available anatomy", () => {
    const pairs = spinalSourcePairs(fixture());
    expect(pairs).toHaveLength(62);
    expect(new Set(pairs.map((p) => p.canonicalId)).size).toBe(62);
    expect(pairs.at(-1)!.canonicalId).toBe("nervous-spinal-nerve-co1-right");
    expect(
      pairs.every(
        (p) =>
          !p.runtimeImported && !p.alignmentVerified && !p.medicallyVerified,
      ),
    ).toBe(true);
  });
  it("refuses empty sides, missing levels and double-owned source cells", () => {
    const missing = fixture();
    missing.delete("C8 spinal nerve");
    expect(() => spinalSourcePairs(missing)).toThrow("Missing source");
    const empty = fixture();
    empty.get("left")!.volumes.clear();
    expect(() => spinalSourcePairs(empty)).toThrow("Empty source");
    const overlap = fixture();
    overlap.get("right")!.volumes.add(1);
    expect(() => spinalSourcePairs(overlap)).toThrow("duplicate");
  });
});
