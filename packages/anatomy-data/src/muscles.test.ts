import { describe, expect, it } from "vitest";
import {
  resolveVisibleStructureIds,
  resolveGroupMembers,
  toggleAllSystems,
} from "@anatomy/core";
import {
  ANATOMY_CATALOG,
  STRUCTURES,
  MUSCLE_ASSET,
  MUSCLE_STRUCTURES,
  MUSCLE_INVENTORY,
  MUSCLE_GROUPS,
  MUSCLE_COVERAGE,
  AVAILABLE_SYSTEM_IDS,
  ASSET_MANIFEST,
} from "./index";

describe("additive muscular catalog", () => {
  it("preserves the skeletal boundary and registers every real muscular mapping", () => {
    expect(STRUCTURES).toHaveLength(29);
    expect(new Set(ANATOMY_CATALOG.map((i) => i.id)).size).toBe(
      ANATOMY_CATALOG.length,
    );
    expect(
      ASSET_MANIFEST.assets.find((a) => a.id === MUSCLE_ASSET.id)?.structureIds,
    ).toEqual(MUSCLE_ASSET.structures.map((i) => i.id));
    expect(
      MUSCLE_STRUCTURES.filter((i) => i.status === "available"),
    ).toHaveLength(MUSCLE_ASSET.structures.length);
    expect(MUSCLE_ASSET.anatomicallyComplete).toBe(false);
  });
  it.each([[], ["skeletal"], ["muscular"], ["skeletal", "muscular"]])(
    "resolves composable layer state %j",
    (...systems) => {
      const active = new Set(systems);
      const visible = resolveVisibleStructureIds(ANATOMY_CATALOG, active);
      expect(visible.has("skull")).toBe(active.has("skeletal"));
      expect(visible.has("muscle-deltoid-left")).toBe(active.has("muscular"));
      expect(visible.has("muscle-rectus-abdominis-left")).toBe(false);
      expect(toggleAllSystems(AVAILABLE_SYSTEM_IDS, active).size).toBe(
        AVAILABLE_SYSTEM_IDS.length,
      );
    },
  );
  it("keeps every source mesh unique, laterality spatially plausible, and missing geometry explicit", () => {
    const files = MUSCLE_ASSET.structures.flatMap((i) =>
      i.sourceFiles.map((f) => f.id),
    );
    expect(new Set(files).size).toBe(files.length);
    for (const item of MUSCLE_ASSET.structures) {
      const center = (item.bounds.min[0] + item.bounds.max[0]) / 2;
      if (item.laterality === "left") expect(center).toBeGreaterThan(-0.002);
      if (item.laterality === "right") expect(center).toBeLessThan(0.002);
    }
    expect(MUSCLE_COVERAGE.missing).toBeGreaterThan(0);
    expect(MUSCLE_COVERAGE.groupedOnly).toBe(22);
    expect(
      MUSCLE_INVENTORY.filter((i) => i.mappingStatus === "missing").every(
        (i) => i.gap && i.meshIds.length === 0,
      ),
    ).toBe(true);
    expect(
      MUSCLE_INVENTORY.filter((i) => i.groupedIn).every((i) =>
        MUSCLE_ASSET.structures.some((s) => s.id === i.groupedIn),
      ),
    ).toBe(true);
  });
  it("resolves complete groups including unavailable members, both sides and anatomical compartments", () => {
    const intrinsic = MUSCLE_GROUPS.find(
      (g) => g.id === "muscle-group-backDeep",
    )!;
    expect(resolveGroupMembers(intrinsic, ANATOMY_CATALOG)).toHaveLength(
      intrinsic.memberIds.length,
    );
    expect(intrinsic.memberIds.length).toBeGreaterThan(30);
    const cuff = MUSCLE_GROUPS.find((g) => g.id === "muscle-group-cuff")!;
    expect(cuff.memberIds).toHaveLength(8);
    expect(cuff.memberIds).toContain("muscle-infraspinatus-left");
    const quadriceps = MUSCLE_GROUPS.find(
      (group) => group.id === "muscle-group-quadriceps",
    )!;
    expect(quadriceps.parentId).toBe("muscle-group-thighAnterior");
    expect(quadriceps.memberIds).toHaveLength(8);
    const hidden = resolveVisibleStructureIds(
      ANATOMY_CATALOG,
      new Set(["muscular"]),
      { hiddenIds: new Set(["muscle-deltoid-left"]), isolatedIds: new Set() },
    );
    expect(hidden.has("muscle-deltoid-left")).toBe(false);
    expect(hidden.has("muscle-deltoid-right")).toBe(true);
  });
});
