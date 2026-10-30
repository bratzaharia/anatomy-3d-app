import { describe, expect, it } from "vitest";
import {
  brainAtlasBlockers,
  brainSelectionState,
  toggleBrainSelection,
  type BrainAtlasEvidence,
} from "@anatomy/core";
import {
  BRAIN_ATLASES,
  BRAIN_CATEGORIES,
  BRAIN_IDS,
  BRAIN_REGIONS,
  BRAIN_SOURCE,
  BRAIN_TREE,
  brainRegionColor,
} from "./brain";
describe("source-identified brain subset and fail-closed atlas gate", () => {
  it("covers only the exact 53 independently mapped source parts", () => {
    expect(BRAIN_REGIONS).toHaveLength(53);
    expect(BRAIN_IDS).not.toContain("nervous-spinal-cord");
    expect(new Set(BRAIN_IDS).size).toBe(53);
    expect(BRAIN_TREE.flatMap((n) => n.memberIds).sort()).toEqual(
      [...BRAIN_IDS].sort(),
    );
    expect(
      BRAIN_REGIONS.every(
        (r) =>
          r.assetId === BRAIN_SOURCE.assetId &&
          r.reviewStatus === "unreviewed" &&
          r.atlasId === null &&
          r.terminologyIds.length > 0,
      ),
    ).toBe(true);
    expect(BRAIN_REGIONS.filter((r) => r.laterality === "left")).toHaveLength(
      23,
    );
    for (const r of BRAIN_REGIONS.filter((r) => r.homologueId))
      expect(
        BRAIN_REGIONS.find((other) => other.id === r.homologueId)?.homologueId,
      ).toBe(r.id);
    expect(
      BRAIN_CATEGORIES.find((g) => g.id === "white-matter")?.stems,
    ).toContain("corpus-callosum");
    expect(BRAIN_REGIONS.some((r) => r.id.includes("ventricle"))).toBe(false);
  });
  it("supports independent group selection and indeterminate parents", () => {
    const left = BRAIN_REGIONS.filter((r) => r.laterality === "left").map(
        (r) => r.id,
      ),
      current = new Set([BRAIN_IDS[0]!]);
    expect(brainSelectionState(BRAIN_IDS, current)).toEqual({
      checked: false,
      indeterminate: true,
    });
    const both = toggleBrainSelection(current, left);
    expect(left.every((id) => both.has(id))).toBe(true);
    expect(toggleBrainSelection(both, left).size).toBe(0);
    expect(current.size).toBe(1);
  });
  it("keeps custom colors keyed by anatomical ID, not a global material", () => {
    const styles = { [BRAIN_IDS[0]!]: { color: "#123456" } };
    expect(brainRegionColor(BRAIN_IDS[0]!, "classical", styles)).toBe(
      "#123456",
    );
    expect(brainRegionColor(BRAIN_IDS[1]!, "classical", styles)).not.toBe(
      "#123456",
    );
    expect(brainRegionColor("not-a-region", "custom", styles)).toBeUndefined();
    expect(brainRegionColor(BRAIN_IDS[1]!, "custom", styles)).toBeUndefined();
  });
  it("never advertises a candidate as integrated", () => {
    expect(BRAIN_ATLASES).toHaveLength(5);
    for (const a of BRAIN_ATLASES) {
      expect(a.integrated).toBe(false);
      expect(brainAtlasBlockers(a.correspondence, BRAIN_SOURCE.sha256)).toEqual(
        ["missing-correspondence"],
      );
    }
  });
  it("rejects wrong topology, unreviewed registration, guessed mapping and licensing", () => {
    const e: BrainAtlasEvidence = {
      targetSha256: "bad",
      labelMapSha256: "",
      templateSha256: "",
      labelCount: 0,
      mappedFaceCount: 5,
      targetFaceCount: 10,
      nativeSpace: "",
      method: "nearest-coordinate",
      license: { sourceUrl: "", commercialRedistributionApproved: false },
      registration: {
        independentlyReviewed: false,
        reviewer: null,
        reportSha256: null,
        hemisphereChecked: false,
        targetTopologyChecked: false,
      },
    };
    expect(brainAtlasBlockers(e, BRAIN_SOURCE.sha256)).toEqual([
      "target-mismatch",
      "missing-pinned-evidence",
      "incomplete-labels",
      "invalid-correspondence-method",
      "license-not-approved",
      "registration-not-reviewed",
    ]);
  });
});
