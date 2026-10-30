import { describe, expect, it } from "vitest";
import {
  ANATOMY_COVERAGE,
  ANATOMY_CATALOG,
  ASSET_MANIFEST,
  SKELETAL_PART_STRUCTURES,
  SKELETAL_PART_GROUPS,
  summarizeCoverage,
} from "./index";
import { resolveVisibleStructureIds, validateHierarchy } from "@anatomy/core";
describe("source-exact skeletal identities and honest coverage", () => {
  it("counts actual bone concepts once, not source meshes or logical parents", () => {
    expect(SKELETAL_PART_STRUCTURES).toHaveLength(157);
    expect(
      summarizeCoverage(
        ANATOMY_COVERAGE.filter((e) => e.system === "skeletal"),
      ),
    ).toEqual({
      total: 206,
      individual: 199,
      sets: 0,
      groupedOnly: 0,
      missing: 7,
    });
    expect(
      summarizeCoverage(
        ANATOMY_COVERAGE.filter((e) => e.system === "muscular"),
      ),
    ).toEqual({
      total: 520,
      individual: 329,
      sets: 26,
      groupedOnly: 22,
      missing: 143,
    });
    expect(
      summarizeCoverage(ANATOMY_COVERAGE.filter((e) => e.system === "nervous")),
    ).toEqual({
      total: 465,
      individual: 249,
      sets: 53,
      groupedOnly: 0,
      missing: 163,
    });
    expect(new Set(ANATOMY_COVERAGE.map((e) => e.structure.id)).size).toBe(
      ANATOMY_COVERAGE.length,
    );
  });
  it("never promotes missing bones, grouped-only muscles or quarantined nerves to geometry", () => {
    const visible = resolveVisibleStructureIds(
      ANATOMY_CATALOG,
      new Set(["skeletal", "muscular", "nervous"]),
    );
    for (const entry of ANATOMY_COVERAGE.filter(
      (e) => e.status === "missing" || e.status === "grouped-only",
    )) {
      expect(visible.has(entry.structure.id)).toBe(false);
      expect(
        ASSET_MANIFEST.assets.some((a) =>
          a.structureIds.includes(entry.structure.id),
        ),
      ).toBe(false);
    }
    expect(
      ANATOMY_COVERAGE.find(
        (e) => e.structure.id === "muscle-flexor-pollicis-brevis-left",
      )?.reason,
    ).toBe("side-conflict");
    expect(
      ANATOMY_COVERAGE.find((e) => e.structure.id === "nervous-spinal-cord")
        ?.reason,
    ).toBe("spinal-quarantine");
    expect(validateHierarchy(ANATOMY_CATALOG)).toEqual([]);
  });
  it("composes parent/child hiding and isolation without selecting a whole group by accident", () => {
    for (const group of SKELETAL_PART_GROUPS) {
      const child = SKELETAL_PART_STRUCTURES.find(
        (s) => s.id === group.memberIds[0],
      )!;
      const hidden = resolveVisibleStructureIds(
        ANATOMY_CATALOG,
        new Set(["skeletal"]),
        { hiddenIds: new Set([child.parentId!]), isolatedIds: new Set() },
      );
      expect(group.memberIds.every((id) => !hidden.has(id))).toBe(true);
      const isolated = resolveVisibleStructureIds(
        ANATOMY_CATALOG,
        new Set(["skeletal"]),
        { hiddenIds: new Set(), isolatedIds: new Set([child.id]) },
      );
      expect([...isolated]).toEqual([child.id]);
      const parent = resolveVisibleStructureIds(
        ANATOMY_CATALOG,
        new Set(["skeletal"]),
        { hiddenIds: new Set(), isolatedIds: new Set([child.parentId!]) },
      );
      expect(group.memberIds.every((id) => parent.has(id))).toBe(true);
    }
  });
});
