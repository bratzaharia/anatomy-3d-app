import type { AnatomicalStructure, AnatomyGroup } from "@anatomy/core";
import manifest from "./skeleton-manifest.json";
import layout from "./skeletal-parts.json";

if (layout.assetSha256 !== manifest.sha256)
  throw Error("Stale skeletal partition");
export const SKELETAL_PART_PARENTS = layout.parents;
export const SKELETAL_PART_MAPPINGS = layout.parents.flatMap((parent) => {
  const source = manifest.structures.find((s) => s.id === parent.id)!;
  return parent.parts.map((part) => ({
    ...part,
    parentId: parent.id,
    regionId: source.regionId,
    sourceConcepts: source.sourceConcepts.filter(
      (c) => c.conceptId === part.conceptId,
    ),
    sourceFiles: source.sourceFiles.filter((f) =>
      source.sourceConcepts
        .find((c) => c.conceptId === part.conceptId)!
        .fileIds.includes(f.id),
    ),
  }));
});
export const SKELETAL_PART_STRUCTURES: readonly AnatomicalStructure[] =
  SKELETAL_PART_MAPPINGS.map((part) => ({
    id: part.id,
    names: part.names,
    latinName: part.latinName,
    laterality: part.laterality as "left" | "right" | "midline",
    parentId: part.parentId,
    structureType: "bone",
    systemIds: ["skeletal"],
    regionIds: [part.regionId],
    groupIds: ["bones-" + part.parentId],
    assetIds: [manifest.id],
    status: "available",
    provenance: [
      {
        sourceTitle: "BodyParts3D 4.0 — " + part.conceptId,
        sourceUrl: manifest.sourceUrl,
        license: manifest.licenseId,
        reviewStatus: "unreviewed",
      },
    ],
  }));
export const SKELETAL_PART_GROUPS: readonly AnatomyGroup[] = layout.parents.map(
  (parent) => ({
    id: "bones-" + parent.id,
    names: manifest.structures.find((s) => s.id === parent.id)!.names,
    memberIds: parent.parts.map((p) => p.id),
  }),
);
// Explicit gaps in the defined conventional adult-bone scope, not substitute meshes.
// Teeth and variable/accessory sesamoids are outside this scope. Editorial RO/Latin
// terminology requires medical review, as do all existing atlas labels.
const missing = [
  {
    id: "bone-coccyx",
    names: { en: "Coccyx", ro: "Coccis" },
    latinName: "Os coccygis",
    regionIds: ["pelvis"],
    laterality: "midline",
  },
  ...(["left", "right"] as const).flatMap((side) =>
    [
      { stem: "malleus", en: "malleus", ro: "Ciocan", latin: "Malleus" },
      { stem: "incus", en: "incus", ro: "Nicovală", latin: "Incus" },
      { stem: "stapes", en: "stapes", ro: "Scăriță", latin: "Stapes" },
    ].map((b) => ({
      id: `bone-${b.stem}-${side}`,
      names: {
        en: `${side === "left" ? "Left" : "Right"} ${b.en}`,
        ro: `${b.ro} — ${side === "left" ? "stânga" : "dreapta"}`,
      },
      latinName: b.latin,
      regionIds: ["head"],
      laterality: side,
    })),
  ),
];
export const SKELETAL_MISSING_STRUCTURES: readonly AnatomicalStructure[] =
  missing.map((item) => ({
    ...item,
    laterality: item.laterality as "midline" | "left" | "right",
    structureType: "bone",
    systemIds: ["skeletal"],
    groupIds: ["skeletal-missing"],
    assetIds: [],
    status: "unavailable",
    provenance: [
      {
        sourceTitle: "FIPAT TA2 — bone inventory only",
        sourceUrl:
          "https://cdn.dal.ca/content/dam/dalhousie/pdf/library/FIPAT/TA2/FIPAT-TA2-Part-2.pdf",
        license: "Public-domain anatomical terms; reference only",
        reviewStatus: "unreviewed",
      },
    ],
  }));
export const SKELETAL_MISSING_GROUP: AnatomyGroup = {
  id: "skeletal-missing",
  names: {
    en: "Bones without accepted geometry",
    ro: "Oase fără geometrie acceptată",
  },
  memberIds: missing.map((b) => b.id),
};
