export type BrainMode = "natural" | "regions" | "atlas";
export type BrainPalette = "classical" | "contrast" | "accessible" | "custom";
export interface BrainStyle {
  readonly color?: string;
  readonly opacity?: number;
}
export function brainSelectionState(
  ids: readonly string[],
  selected: ReadonlySet<string>,
) {
  const count = ids.filter((id) => selected.has(id)).length;
  return {
    checked: ids.length > 0 && count === ids.length,
    indeterminate: count > 0 && count < ids.length,
  };
}
export function toggleBrainSelection(
  current: ReadonlySet<string>,
  ids: readonly string[],
): ReadonlySet<string> {
  const next = new Set(current),
    remove = ids.length > 0 && ids.every((id) => next.has(id));
  ids.forEach((id) => (remove ? next.delete(id) : next.add(id)));
  return next;
}

// The renderer cannot promote an atlas merely because its file loaded. A future
// importer must provide target-bound topology and independent registration QA.
export interface BrainAtlasEvidence {
  readonly targetSha256: string;
  readonly labelMapSha256: string;
  readonly templateSha256: string;
  readonly labelCount: number;
  readonly mappedFaceCount: number;
  readonly targetFaceCount: number;
  readonly nativeSpace: string;
  readonly method:
    | "surface-correspondence"
    | "validated-volume-to-surface"
    | "nearest-coordinate";
  readonly license: {
    readonly sourceUrl: string;
    readonly commercialRedistributionApproved: boolean;
  };
  readonly registration: {
    readonly independentlyReviewed: boolean;
    readonly reviewer: string | null;
    readonly reportSha256: string | null;
    readonly hemisphereChecked: boolean;
    readonly targetTopologyChecked: boolean;
  };
}
export function brainAtlasBlockers(
  e: BrainAtlasEvidence | null,
  targetSha256: string,
): readonly string[] {
  if (!e) return ["missing-correspondence"];
  const errors: string[] = [],
    sha = /^[a-f0-9]{64}$/;
  if (e.targetSha256 !== targetSha256) errors.push("target-mismatch");
  if (
    ![e.labelMapSha256, e.templateSha256, e.registration.reportSha256].every(
      (s) => typeof s === "string" && sha.test(s),
    )
  )
    errors.push("missing-pinned-evidence");
  if (
    !e.nativeSpace.trim() ||
    !Number.isSafeInteger(e.labelCount) ||
    e.labelCount <= 0 ||
    !Number.isSafeInteger(e.targetFaceCount) ||
    e.targetFaceCount <= 0 ||
    e.mappedFaceCount !== e.targetFaceCount
  )
    errors.push("incomplete-labels");
  if (e.method === "nearest-coordinate")
    errors.push("invalid-correspondence-method");
  if (
    !e.license.commercialRedistributionApproved ||
    !e.license.sourceUrl.startsWith("https://")
  )
    errors.push("license-not-approved");
  if (
    !e.registration.independentlyReviewed ||
    !e.registration.reviewer?.trim() ||
    !e.registration.hemisphereChecked ||
    !e.registration.targetTopologyChecked
  )
    errors.push("registration-not-reviewed");
  return errors;
}
