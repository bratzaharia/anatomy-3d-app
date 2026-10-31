import { describe, it, expect } from "vitest";
import {
  traceArterial,
  validateArterialGraph,
  resolveArterialStructureIds,
} from "@anatomy/core";
import {
  ARTERIAL_GEOMETRY,
  ARTERIAL_STRUCTURES,
  ARTERIAL_SHARED_IDS,
  ARTERIAL_COVERAGE,
  ARTERIAL_EDGES,
  ARTERIAL_GROUP_NAMES,
  ARTERIAL_ASSETS,
  ARTERIAL_MANIFEST,
} from "./arterial";
import { CARDIAC_GEOMETRY } from "./heart";
import { ANATOMY_CATALOG, ASSET_MANIFEST, searchStructures } from "./index";
describe("authentic partial arterial inventory", () => {
  it("preserves 7 cardiac identities and assigns every disjoint source exactly once", () => {
    expect(ARTERIAL_GEOMETRY).toHaveLength(219);
    expect(ARTERIAL_SHARED_IDS.size).toBe(7);
    const source = ARTERIAL_GEOMETRY.flatMap((p) =>
      p.sourceFiles.map((f) => f.id),
    );
    expect(new Set(source).size).toBe(source.length);
    for (const id of ARTERIAL_SHARED_IDS) {
      expect(ANATOMY_CATALOG.filter((s) => s.id === id)).toHaveLength(1);
      expect(
        ASSET_MANIFEST.assets.filter((a) => a.structureIds.includes(id)),
      ).toHaveLength(1);
      expect(ARTERIAL_GEOMETRY.find((s) => s.id === id)?.sourceFiles).toEqual(
        CARDIAC_GEOMETRY.find((s) => s.id === id)?.sourceFiles,
      );
    }
    expect(
      ARTERIAL_COVERAGE.filter((s) => s.geometry === "individual"),
    ).toHaveLength(214);
    expect(ARTERIAL_COVERAGE.filter((s) => s.geometry === "set")).toHaveLength(
      5,
    );
    expect(ARTERIAL_MANIFEST.complete).toBe(false);
    expect(ARTERIAL_ASSETS.filter((a) => a.id.includes("heart"))).toHaveLength(
      1,
    );
  });
  it("keeps geometry, reference registration, connectivity and medical review distinct", () => {
    for (const s of ARTERIAL_COVERAGE) {
      expect(s.medicalReview).toBe("pending");
      expect(s.connectivityReviewed).toBe(false);
      if (s.geometry === "missing") {
        expect(s.selectable).toBe(false);
        expect(s.assetId).toBeNull();
      }
    }
    expect(
      ARTERIAL_STRUCTURES.filter((s) => s.circulation === "pulmonary").every(
        (s) =>
          s.systemIds.includes("arterial") && !s.systemIds.includes("venous"),
      ),
    ).toBe(true);
    expect(ARTERIAL_STRUCTURES.every((s) => s.names.en && s.names.ro)).toBe(
      true,
    );
    expect(
      searchStructures("FMA22734", "ro").some(
        (s) => s.id === "arterial-fma22734",
      ),
    ).toBe(true);
    expect(
      ARTERIAL_MANIFEST.inventory.filter((s) => s.sex === "male"),
    ).toHaveLength(2);
  });
  it("traces side-specific radial and cerebral origins; does not infer absent continuations", () => {
    expect(
      validateArterialGraph(
        new Set(ARTERIAL_STRUCTURES.map((s) => s.id)),
        ARTERIAL_EDGES,
      ),
    ).toEqual([]);
    expect(
      traceArterial("arterial-fma22734", ARTERIAL_EDGES, "origin"),
    ).toEqual([
      "arterial-fma22734",
      "arterial-fma22692",
      "arterial-fma22656",
      "arterial-fma4694",
      "arterial-fma3768",
      "cardiac-fma3736",
    ]);
    const right = traceArterial("arterial-fma22733", ARTERIAL_EDGES, "origin");
    expect(right).toContain("arterial-fma3932");
    expect(right).not.toContain("arterial-fma4694");
    expect(
      traceArterial("arterial-fma50367", ARTERIAL_EDGES, "origin"),
    ).toEqual([
      "arterial-fma50367",
      "arterial-fma4062",
      "arterial-fma4058",
      "arterial-fma3768",
      "cardiac-fma3736",
    ]);
    expect(
      traceArterial("arterial-fma50542", ARTERIAL_EDGES, "origin"),
    ).toEqual(expect.arrayContaining(["arterial-fma3958", "arterial-fma4066"]));
    expect(
      traceArterial("arterial-fma50445", ARTERIAL_EDGES, "origin"),
    ).toEqual(["arterial-fma50445"]);
    expect(
      traceArterial("cardiac-fma8612", ARTERIAL_EDGES, "branches"),
    ).not.toContain("cardiac-fma3736");
  });
  it("bounds collateral cycles, excludes unverified edges and rejects unknown references", () => {
    const base = ARTERIAL_EDGES[0]!,
      edges = [
        { ...base, from: "a", to: "b" },
        { ...base, from: "b", to: "a" },
        { ...base, from: "b", to: "c", evidence: "unverified" as const },
        { ...base, from: "b", to: "d", relation: "anastomosis" as const },
      ];
    expect(traceArterial("a", edges, "branches")).toEqual(["a", "b"]);
    expect(
      validateArterialGraph(new Set(["a", "b"]), edges.slice(0, 2)).some((e) =>
        e.includes("origin cycle"),
      ),
    ).toBe(true);
    expect(
      validateArterialGraph(new Set(["a", "b"]), [
        { ...edges[0]!, relation: "anastomosis" },
        { ...edges[1]!, relation: "anastomosis" },
      ]),
    ).toEqual([]);
    expect(
      validateArterialGraph(new Set(["a", "b"]), edges).length,
    ).toBeGreaterThan(0);
  });
  it("ANDs visibility/facets, defaults to major detail, and preserves disabled/hidden/isolation semantics", () => {
    const f = {
        groups: new Set(Object.keys(ARTERIAL_GROUP_NAMES)),
        levels: new Set(["major"] as const),
        sides: new Set<"left">(),
      },
      o = { hiddenIds: new Set<string>(), isolatedIds: new Set<string>() };
    expect(
      resolveArterialStructureIds(ARTERIAL_STRUCTURES, new Set(), o, f).size,
    ).toBe(0);
    expect(
      resolveArterialStructureIds(
        ARTERIAL_STRUCTURES,
        new Set(["arterial"]),
        o,
        f,
      ).size,
    ).toBe(55);
    const ids = resolveArterialStructureIds(
      ARTERIAL_STRUCTURES,
      new Set(["arterial"]),
      { ...o, hiddenIds: new Set(["arterial-fma22734"]) },
      { ...f, groups: new Set(["upper-limb"]), sides: new Set(["left"]) },
    );
    expect(ids.has("arterial-fma22734")).toBe(false);
    expect(ids.has("arterial-fma22733")).toBe(false);
    expect(ids.has("arterial-fma22692")).toBe(true);
    expect(
      resolveArterialStructureIds(
        ARTERIAL_STRUCTURES,
        new Set(["arterial"]),
        o,
        { ...f, levels: new Set() },
      ).size,
    ).toBe(0);
    expect(
      resolveArterialStructureIds(
        ARTERIAL_STRUCTURES,
        new Set(["arterial"]),
        { ...o, isolatedIds: new Set(["arterial-fma22734"]) },
        f,
      ),
    ).toEqual(new Set(["arterial-fma22734"]));
  });
});
