import { describe, expect, it } from "vitest";
import {
  resolveVenousStructureIds,
  traceVenousDrainage,
  validateVenousConnections,
} from "@anatomy/core";
import {
  VENOUS_MANIFEST,
  VENOUS_INVENTORY,
  VENOUS_STRUCTURES,
  VENOUS_ASSETS,
  VENOUS_CONNECTIONS,
  VENOUS_COVERAGE,
  searchStructures,
} from "./index";
const groups = new Set(VENOUS_MANIFEST.groups.map((g) => g.key));
const empty = { hiddenIds: new Set<string>(), isolatedIds: new Set<string>() };
describe("independent sourced venous inventory", () => {
  it("separates availability, representation and medical review", () => {
    expect(new Set(VENOUS_INVENTORY.map((s) => s.id)).size).toBe(
      VENOUS_INVENTORY.length,
    );
    expect(VENOUS_COVERAGE.individual).toBeGreaterThan(60);
    expect(VENOUS_COVERAGE.missing).toBeGreaterThan(50);
    expect(VENOUS_MANIFEST.anatomicallyComplete).toBe(false);
    for (const s of VENOUS_INVENTORY) {
      expect(s.names.ro).not.toBe("");
      expect(s.names.en).not.toBe("");
      expect(s.validationStatus).toBe("unverified");
      expect(s.reviewedBy).toBeNull();
      expect(s.assetId !== null).toBe(s.geometryType === "surface-mesh");
      expect(s.assetId !== null).toBe(s.geometryStatus !== "unavailable");
      if (!s.assetId) {
        expect(s.meshIds).toEqual([]);
        expect(s.missingReason).toBeTruthy();
        expect(s.triangleCount).toBe(0);
      } else {
        expect(
          VENOUS_ASSETS.find((a) => a.id === s.assetId)?.structureIds,
        ).toContain(s.id);
        expect(s.bounds).not.toBeNull();
      }
    }
    expect(
      VENOUS_INVENTORY.filter((s) => s.sex === "female-only").every(
        (s) => s.assetId === null,
      ),
    ).toBe(true);
    expect(
      VENOUS_INVENTORY.filter((s) => s.territory === "pulmonary").every(
        (s) => s.venousCategory === "vein",
      ),
    ).toBe(true);
  });
  it("uses unique source meshes with lossless regional manifests", () => {
    const sourceIds = VENOUS_INVENTORY.filter((s) => s.assetId).flatMap((s) =>
      s.sourceFiles.map((f) => f.id),
    );
    expect(new Set(sourceIds).size).toBe(sourceIds.length);
    expect(VENOUS_ASSETS.length).toBeGreaterThan(4);
    expect(
      VENOUS_ASSETS.every(
        (a) =>
          a.lod === 0 &&
          a.compression.includes("lossless") &&
          a.licenseId === "CC-BY-4.0",
      ),
    ).toBe(true);
    expect(VENOUS_MANIFEST.registration.rmsMm).toBe(0);
    expect(VENOUS_MANIFEST.registration.landmarks).toHaveLength(29);
  });
  it("composes groups, depth, regions and global visibility without changing other systems", () => {
    const systems = new Set(["skeletal", "muscular", "nervous", "venous"]);
    const all = resolveVenousStructureIds(VENOUS_STRUCTURES, systems, empty, {
      groups,
      depths: new Set(),
      regions: new Set(),
    });
    expect(all.size).toBe(VENOUS_COVERAGE.individual + VENOUS_COVERAGE.grouped);
    expect(
      resolveVenousStructureIds(
        VENOUS_STRUCTURES,
        new Set(["skeletal"]),
        empty,
        { groups, depths: new Set(), regions: new Set() },
      ).size,
    ).toBe(0);
    const filtered = resolveVenousStructureIds(
      VENOUS_STRUCTURES,
      systems,
      empty,
      {
        groups: new Set(["upper-limb", "lower-limb"]),
        depths: new Set(["superficial"]),
        regions: new Set(["lower-limb-left"]),
      },
    );
    expect(filtered.has("venous-great-saphenous-vein-left")).toBe(true);
    expect(filtered.has("venous-great-saphenous-vein-right")).toBe(false);
    expect(filtered.has("venous-femoral-vein-left")).toBe(false);
    expect(
      resolveVenousStructureIds(VENOUS_STRUCTURES, systems, empty, {
        groups: new Set(),
        depths: new Set(),
        regions: new Set(),
      }).size,
    ).toBe(0);
    const id = "venous-cephalic-vein-left";
    expect([
      ...resolveVenousStructureIds(
        VENOUS_STRUCTURES,
        systems,
        { ...empty, isolatedIds: new Set([id]) },
        { groups, depths: new Set(), regions: new Set() },
      ),
    ]).toEqual([id]);
    expect(
      resolveVenousStructureIds(
        VENOUS_STRUCTURES,
        systems,
        { ...empty, hiddenIds: new Set([id]) },
        { groups, depths: new Set(), regions: new Set() },
      ).has(id),
    ).toBe(false);
  });
  it("searches RO/EN/Latin and real source IDs", () => {
    expect(
      searchStructures("safenă mare", "ro").some(
        (s) => s.id === "venous-great-saphenous-vein-left",
      ),
    ).toBe(true);
    expect(
      searchStructures("Vena saphena magna", "en").some(
        (s) => s.id === "venous-great-saphenous-vein-left",
      ),
    ).toBe(true);
    expect(
      searchStructures("FMA13326", "en").some(
        (s) => s.id === "venous-cephalic-vein-left",
      ),
    ).toBe(true);
  });
  it("keeps portal microcirculation explicit and pulmonary drainage separate", () => {
    const ids = new Set(
      [...VENOUS_INVENTORY, ...VENOUS_MANIFEST.collectionPoints].map(
        (s) => s.id,
      ),
    );
    expect(validateVenousConnections(ids, VENOUS_CONNECTIONS)).toEqual([]);
    const portal = traceVenousDrainage(
      "venous-hepatic-portal-vein",
      VENOUS_CONNECTIONS,
    );
    expect(portal).toContain("collection-hepatic-sinusoids");
    expect(portal).toContain("collection-right-atrium");
    expect(
      VENOUS_CONNECTIONS.some(
        (e) =>
          e.from === "venous-hepatic-portal-vein" &&
          e.to === "venous-inferior-vena-cava",
      ),
    ).toBe(false);
    expect(
      traceVenousDrainage(
        "venous-left-superior-pulmonary-vein",
        VENOUS_CONNECTIONS,
      ),
    ).toEqual([
      "venous-left-superior-pulmonary-vein",
      "collection-left-atrium",
    ]);
    expect(
      traceVenousDrainage("venous-testicular-vein-left", VENOUS_CONNECTIONS),
    ).toContain("venous-renal-vein-left");
    expect(
      traceVenousDrainage("venous-testicular-vein-right", VENOUS_CONNECTIONS),
    ).not.toContain("venous-renal-vein-right");
    const bad = [
      ...VENOUS_CONNECTIONS,
      {
        ...VENOUS_CONNECTIONS[0]!,
        from: "collection-right-atrium",
        to: "venous-superior-vena-cava",
      },
    ];
    expect(
      validateVenousConnections(ids, bad).some((e) => e.includes("cycle")),
    ).toBe(true);
  });
});
