import { describe, expect, it } from "vitest";
import {
  AVAILABLE_SYSTEM_IDS,
  GROUPS,
  SKELETON_ASSET,
  STRUCTURES,
  skeletonManifestSchema,
} from "./index";
import { resolveVisibleStructureIds, resolveGroupMembers } from "@anatomy/core";

describe("sourced skeleton catalog", () => {
  it("maps every available entity to the audited skeletal asset", () => {
    expect(AVAILABLE_SYSTEM_IDS).toEqual([
      "skeletal",
      "muscular",
      "nervous",
      "venous",
      "arterial",
    ]);
    for (const structure of STRUCTURES) {
      expect(structure.assetIds).toEqual([SKELETON_ASSET.id]);
      expect(structure.provenance[0]?.license).toBe("CC-BY-4.0");
      expect(
        SKELETON_ASSET.structures.find((item) => item.id === structure.id),
      ).toBeDefined();
    }
  });
  it("keeps every imported source mesh unique and traceable", () => {
    const files = SKELETON_ASSET.structures.flatMap((item) =>
      item.sourceFiles.map((file) => file.id),
    );
    expect(new Set(files).size).toBe(files.length);
    expect(files.length).toBe(SKELETON_ASSET.sourceMeshCount);
    expect(
      SKELETON_ASSET.structures
        .flatMap((item) => item.sourceConcepts)
        .some((item) => /eye|cartilage|muscle/i.test(item.name)),
    ).toBe(false);
  });
  it("resolves the complete skeletal group and visibility overrides", () => {
    const group = GROUPS[0];
    if (!group) throw new Error("Missing skeletal group");
    expect(resolveGroupMembers(group, STRUCTURES)).toHaveLength(
      STRUCTURES.length,
    );
    expect(
      resolveVisibleStructureIds(STRUCTURES, new Set(["muscular"])).size,
    ).toBe(0);
    const visible = resolveVisibleStructureIds(
      STRUCTURES,
      new Set(["skeletal"]),
      { hiddenIds: new Set(["skull"]), isolatedIds: new Set() },
    );
    expect(visible.has("skull")).toBe(false);
    expect(visible.has("humerus-left")).toBe(true);
  });
  it("rejects missing license and malformed source mappings", () => {
    expect(
      skeletonManifestSchema.safeParse({
        ...SKELETON_ASSET,
        licenseId: "unknown",
      }).success,
    ).toBe(false);
    expect(
      skeletonManifestSchema.safeParse({ ...SKELETON_ASSET, sha256: "" })
        .success,
    ).toBe(false);
  });
});
