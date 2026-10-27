import { describe, expect, it } from "vitest";
import type { AnatomicalStructure } from "./index";
import {
  isAllSelected,
  resolveVisibleStructureIds,
  toggleAllSystems,
  validateHierarchy,
} from "./index";

const provenance = [
  {
    sourceTitle: "Terminologia Anatomica",
    sourceUrl: "https://fipat.library.dal.ca/",
    license: "Reference only",
    reviewStatus: "unreviewed" as const,
  },
];
const makeStructure = (
  id: string,
  systemIds: string[],
  parentId?: string,
): AnatomicalStructure => ({
  id,
  names: { en: id, ro: id },
  systemIds,
  structureType: "fixture",
  regionIds: ["whole-body"],
  parentId,
  laterality: "none",
  assetIds: [`fixture:${id}`],
  status: "available",
  provenance,
});

describe("visibility engine", () => {
  const structures = [
    makeStructure("bone", ["skeletal"]),
    makeStructure("muscle", ["muscular"]),
    makeStructure("nerve", ["nervous"]),
  ];

  it("composes independent filters", () => {
    expect([
      ...resolveVisibleStructureIds(
        structures,
        new Set(["skeletal", "muscular"]),
      ),
    ]).toEqual(["bone", "muscle"]);
  });

  it("returns an intentional empty scene", () => {
    expect(resolveVisibleStructureIds(structures, new Set()).size).toBe(0);
  });

  it("applies hide and isolate overrides", () => {
    const visible = resolveVisibleStructureIds(
      structures,
      new Set(["skeletal", "muscular"]),
      {
        hiddenIds: new Set(["bone"]),
        isolatedIds: new Set(["bone", "muscle"]),
      },
    );
    expect([...visible]).toEqual(["muscle"]);
  });
});

describe("All semantics", () => {
  const ids = ["skeletal", "muscular", "nervous"];
  it("is derived from the underlying selection", () => {
    expect(isAllSelected(ids, new Set(ids))).toBe(true);
    expect(isAllSelected(ids, new Set(ids.slice(1)))).toBe(false);
  });
  it("selects all, and clears all when already selected", () => {
    expect([...toggleAllSystems(ids, new Set())]).toEqual(ids);
    expect(toggleAllSystems(ids, new Set(ids)).size).toBe(0);
  });
});

describe("hierarchy validation", () => {
  it("detects cycles and missing parents", () => {
    expect(
      validateHierarchy([
        makeStructure("a", ["skeletal"], "b"),
        makeStructure("b", ["skeletal"], "a"),
      ])[0],
    ).toContain("Cycle");
    expect(
      validateHierarchy([makeStructure("a", ["skeletal"], "missing")])[0],
    ).toContain("Missing parent");
  });
});
