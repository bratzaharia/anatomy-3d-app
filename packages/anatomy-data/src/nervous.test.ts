import { describe, expect, it } from "vitest";
import {
  resolveVisibleStructureIds,
  resolveNervousStructureIds,
  validateNervousConnections,
  nervousRelatedIds,
  validateHierarchy,
} from "@anatomy/core";
import {
  NERVOUS_ASSET,
  NERVOUS_INVENTORY,
  NERVOUS_STRUCTURES,
  ANATOMY_CATALOG,
  AVAILABLE_SYSTEM_IDS,
  searchStructures,
} from "./index";

describe("additive, explicitly partial nervous anatomy", () => {
  it("registers only sourced geometry; missing metadata never becomes pickable", () => {
    expect(AVAILABLE_SYSTEM_IDS).toEqual(["skeletal", "muscular", "nervous"]);
    expect(NERVOUS_ASSET.anatomicallyComplete).toBe(false);
    expect(NERVOUS_ASSET.structures).toHaveLength(83);
    const visible = resolveVisibleStructureIds(
      NERVOUS_STRUCTURES,
      new Set(["nervous"]),
    );
    for (const item of NERVOUS_INVENTORY)
      expect(visible.has(item.id)).toBe(item.geometryStatus === "individual");
    expect(visible.has("nervous-spinal-cord")).toBe(false);
    expect(visible.has("nervous-median-nerve-left")).toBe(false);
    expect(validateHierarchy(ANATOMY_CATALOG)).toEqual([]);
  });
  it.each([0, 1, 2, 3, 4, 5, 6, 7])(
    "composes all three system combinations (%i)",
    (mask) => {
      const systems = new Set(
        AVAILABLE_SYSTEM_IDS.filter((_, index) => mask & (1 << index)),
      );
      const visible = resolveVisibleStructureIds(ANATOMY_CATALOG, systems);
      expect(visible.has("skull")).toBe(systems.has("skeletal"));
      expect(visible.has("muscle-deltoid-left")).toBe(systems.has("muscular"));
      expect(visible.has("nervous-optic-nerve-left")).toBe(
        systems.has("nervous"),
      );
    },
  );
  it("catalogs twelve cranial nerve pairs and 31 spinal pairs independently of source coverage", () => {
    const cranial = NERVOUS_INVENTORY.filter((item) => item.cranialNumber),
      spinal = NERVOUS_INVENTORY.filter((item) => item.spinalDesignation);
    expect(cranial).toHaveLength(24);
    expect(new Set(cranial.map((item) => item.cranialNumber)).size).toBe(12);
    expect(spinal).toHaveLength(62);
    expect(new Set(spinal.map((item) => item.spinalDesignation)).size).toBe(31);
    expect(spinal.every((item) => item.geometryStatus === "unavailable")).toBe(
      true,
    );
    expect(
      spinal.filter((item) => /^C\d/.test(item.spinalDesignation!)),
    ).toHaveLength(16);
    expect(
      cranial
        .filter((item) => item.cranialNumber === "II")
        .every((item) => item.division === "cns"),
    ).toBe(true);
  });
  it("combines overlap facets without duplicate geometry or changing other systems", () => {
    const filters = {
      divisions: new Set(["cns", "pns"] as const),
      functions: new Set(["sensory", "motor"] as const),
      regions: new Set(["head"]),
    };
    const visible = resolveNervousStructureIds(
      NERVOUS_STRUCTURES,
      new Set(["nervous"]),
      { hiddenIds: new Set(), isolatedIds: new Set() },
      filters,
    );
    expect([...visible].sort()).toEqual([
      "nervous-optic-nerve-left",
      "nervous-optic-nerve-right",
      "nervous-trochlear-nerve-left",
      "nervous-trochlear-nerve-right",
    ]);
    expect(
      resolveNervousStructureIds(
        NERVOUS_STRUCTURES,
        new Set(["skeletal"]),
        { hiddenIds: new Set(), isolatedIds: new Set() },
        filters,
      ).size,
    ).toBe(0);
    expect(
      resolveNervousStructureIds(
        NERVOUS_STRUCTURES,
        new Set(["nervous"]),
        { hiddenIds: new Set(), isolatedIds: new Set() },
        { ...filters, divisions: new Set() },
      ).size,
    ).toBe(0);
  });
  it("hides brain descendants through canonical hierarchy and keeps connectivity separate", () => {
    const visible = resolveVisibleStructureIds(
      NERVOUS_STRUCTURES,
      new Set(["nervous"]),
      { hiddenIds: new Set(["nervous-brain"]), isolatedIds: new Set() },
    );
    expect(visible.has("nervous-pons")).toBe(false);
    expect(visible.has("nervous-optic-nerve-left")).toBe(true);
    expect(
      validateNervousConnections(
        new Set(NERVOUS_STRUCTURES.map((item) => item.id)),
        NERVOUS_ASSET.connections,
      ),
    ).toEqual([]);
    expect(
      nervousRelatedIds(
        "nervous-sciatic-nerve-left",
        NERVOUS_ASSET.connections,
      ),
    ).toContain("nervous-tibial-nerve-left");
    expect(
      validateNervousConnections(new Set(), NERVOUS_ASSET.connections).length,
    ).toBeGreaterThan(0);
  });
  it("preserves exact nerve-number disambiguation and bilingual names", () => {
    expect(
      searchStructures("CN II", "en")
        .map((item) => item.id)
        .sort(),
    ).toEqual(["nervous-optic-nerve-left", "nervous-optic-nerve-right"]);
    expect(searchStructures("C5", "en")).toHaveLength(2);
    expect(
      searchStructures("nerv median", "ro").some(
        (item) => item.id === "nervous-median-nerve-left",
      ),
    ).toBe(true);
    for (const item of NERVOUS_STRUCTURES) {
      expect(item.names.en).toBeTruthy();
      expect(item.names.ro).toBeTruthy();
      expect(item.provenance[0]?.reviewStatus).toBe("unreviewed");
    }
  });
  it("keeps associated cavities and coverings distinct from neural tissue", () => {
    const ventricles = NERVOUS_INVENTORY.find(
      (item) => item.id === "nervous-lateral-ventricles",
    )!;
    expect(ventricles.laterality).toBe("bilateral");
    expect(ventricles.division).toBe("associated");
    expect(ventricles.geometryStatus).toBe("unavailable");
    const filum = NERVOUS_INVENTORY.find(
      (item) => item.id === "nervous-filum-terminale",
    )!;
    expect(filum.regionIds).toEqual(["back", "pelvis"]);
    expect(filum.division).toBe("associated");
    expect(filum.geometryStatus).toBe("unavailable");
  });
});
