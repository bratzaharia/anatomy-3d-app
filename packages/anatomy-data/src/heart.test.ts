import { describe, it, expect } from "vitest";
import {
  resolveCardiacStructureIds,
  validateCardiacGraph,
} from "@anatomy/core";
import {
  CARDIAC_STRUCTURES,
  CARDIAC_CATALOG,
  CARDIAC_GEOMETRY,
  CARDIAC_GRAPH,
  CARDIAC_GRAPH_CONCEPTS,
  CARDIAC_PATHS,
  CARDIAC_ASSETS,
  CARDIAC_VENOUS_IDS,
  cardiacVenousRoute,
  CARDIAC_SELECTORS,
} from "./heart";
import { VENOUS_STRUCTURES } from "./venous";
describe("source cardiac module", () => {
  it("extends curated upstream venous drainage to the correct atrial cavity", () => {
    expect(cardiacVenousRoute("venous-great-saphenous-vein-left").at(-1)).toBe(
      "cardiac-fma11359",
    );
    expect(cardiacVenousRoute("venous-right-inferior-pulmonary-vein")).toEqual([
      "venous-right-inferior-pulmonary-vein",
      "cardiac-fma9465",
    ]);
    expect(cardiacVenousRoute("unmapped-vein")).toEqual([]);
    expect(
      resolveCardiacStructureIds(
        CARDIAC_STRUCTURES,
        true,
        new Set(["valves"]),
        { hiddenIds: new Set(["cardiac-heart"]), isolatedIds: new Set() },
        CARDIAC_SELECTORS,
      ).size,
    ).toBe(0);
  });
  it("has 30 disjoint source mappings; cavities are never labelled walls", () => {
    expect(CARDIAC_GEOMETRY).toHaveLength(30);
    const files = CARDIAC_GEOMETRY.flatMap((p) =>
      p.sourceFiles.map((f) => f.id),
    );
    expect(new Set(files).size).toBe(files.length);
    expect(
      CARDIAC_GEOMETRY.filter((p) => p.category === "cavity"),
    ).toHaveLength(4);
    expect(
      CARDIAC_GEOMETRY.filter((p) => p.category === "cavity").every(
        (p) => p.geometryRepresentation === "cavity-surface-not-wall",
      ),
    ).toBe(true);
    expect(CARDIAC_GEOMETRY.filter((p) => p.category === "valve")).toHaveLength(
      11,
    );
  });
  it("keeps arterial classification and reuses venous IDs without cardiac duplicates", () => {
    expect(
      CARDIAC_STRUCTURES.filter((s) => s.structureType === "artery").every(
        (s) =>
          s.systemIds.includes("arterial") && !s.systemIds.includes("venous"),
      ),
    ).toBe(true);
    expect(CARDIAC_STRUCTURES.some((s) => s.systemIds.includes("venous"))).toBe(
      false,
    );
    expect(
      CARDIAC_VENOUS_IDS.every((id) =>
        VENOUS_STRUCTURES.some((s) => s.id === id),
      ),
    ).toBe(true);
    expect(
      CARDIAC_ASSETS.flatMap((a) => a.structureIds).some((id) =>
        id.startsWith("venous-"),
      ),
    ).toBe(false);
  });
  it("validates a cited graph and correct cavity destinations, including direct anterior drainage", () => {
    const ids = new Set(
      [...CARDIAC_CATALOG, ...VENOUS_STRUCTURES, ...CARDIAC_GRAPH_CONCEPTS].map(
        (s) => s.id,
      ),
    );
    expect(validateCardiacGraph(ids, CARDIAC_GRAPH)).toEqual([]);
    for (const id of [
      "venous-superior-vena-cava",
      "venous-inferior-vena-cava",
      "venous-coronary-sinus",
      "venous-anterior-cardiac-vein",
    ])
      expect(CARDIAC_GRAPH.find((e) => e.from === id)?.to).toBe(
        "cardiac-fma11359",
      );
    for (const side of ["left", "right"])
      for (const level of ["superior", "inferior"])
        expect(
          CARDIAC_GRAPH.find(
            (e) => e.from === `venous-${side}-${level}-pulmonary-vein`,
          )?.to,
        ).toBe("cardiac-fma9465");
    for (const path of Object.values(CARDIAC_PATHS))
      for (let i = 1; i < path.length; i++)
        expect(
          CARDIAC_GRAPH.some((e) => e.from === path[i - 1] && e.to === path[i]),
        ).toBe(true);
    expect(
      CARDIAC_GRAPH.find((e) => e.to === "cardiac-fma3840")?.variant,
    ).toBeTruthy();
  });
  it("resolves only enabled categories and respects root/leaf hiding and isolation", () => {
    const groups = new Set(["walls"] as const),
      empty = { hiddenIds: new Set<string>(), isolatedIds: new Set<string>() };
    expect(
      resolveCardiacStructureIds(CARDIAC_STRUCTURES, false, groups, empty).size,
    ).toBe(0);
    expect(
      resolveCardiacStructureIds(CARDIAC_STRUCTURES, true, groups, empty).size,
    ).toBe(3);
    expect(
      resolveCardiacStructureIds(CARDIAC_STRUCTURES, true, groups, {
        ...empty,
        hiddenIds: new Set(["cardiac-heart"]),
      }).size,
    ).toBe(0);
    expect(
      resolveCardiacStructureIds(CARDIAC_STRUCTURES, true, groups, {
        ...empty,
        isolatedIds: new Set(["cardiac-fma9457"]),
      }),
    ).toEqual(new Set(["cardiac-fma9457"]));
  });
});
