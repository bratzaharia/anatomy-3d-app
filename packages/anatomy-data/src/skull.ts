import type { AnatomicalStructure, AnatomyGroup } from "@anatomy/core";
import manifest from "./skeleton-manifest.json";
import layout from "./skull-color-ranges.json";

const names: Readonly<Record<string, readonly [string, string]>> = {
  FMA52734: ["Os frontal", "Os frontale"],
  FMA52789: ["Os parietal stâng", "Os parietale sinistrum"],
  FMA52788: ["Os parietal drept", "Os parietale dextrum"],
  FMA52739: ["Os temporal stâng", "Os temporale sinistrum"],
  FMA52738: ["Os temporal drept", "Os temporale dextrum"],
  FMA52735: ["Os occipital", "Os occipitale"],
  FMA52736: ["Os sfenoid", "Os sphenoidale"],
  FMA52740: ["Os etmoid", "Os ethmoidale"],
  FMA53650: ["Maxilă stângă", "Maxilla sinistra"],
  FMA53649: ["Maxilă dreaptă", "Maxilla dextra"],
  FMA52893: ["Os zigomatic stâng", "Os zygomaticum sinistrum"],
  FMA52892: ["Os zigomatic drept", "Os zygomaticum dextrum"],
  FMA53648: ["Os nazal stâng", "Os nasale sinistrum"],
  FMA53647: ["Os nazal drept", "Os nasale dextrum"],
  FMA53646: ["Os lacrimal stâng", "Os lacrimale sinistrum"],
  FMA53645: ["Os lacrimal drept", "Os lacrimale dextrum"],
  FMA53656: ["Os palatin stâng", "Os palatinum sinistrum"],
  FMA53655: ["Os palatin drept", "Os palatinum dextrum"],
  FMA54738: ["Cornet nazal inferior stâng", "Concha nasalis inferior sinistra"],
  FMA54737: ["Cornet nazal inferior drept", "Concha nasalis inferior dextra"],
  FMA9710: ["Vomer", "Vomer"],
};
const skull = manifest.structures.find((item) => item.id === "skull")!;
export const SKULL_BONE_STRUCTURES: readonly AnatomicalStructure[] =
  skull.sourceConcepts.map((source) => {
    const name = names[source.conceptId];
    if (!name) throw new Error("Untranslated skull source " + source.conceptId);
    return {
      id: "skull-" + source.conceptId.toLowerCase(),
      names: {
        en: source.name[0]!.toUpperCase() + source.name.slice(1),
        ro: name[0],
      },
      latinName: name[1],
      parentId: "skull",
      systemIds: ["skeletal"],
      structureType: "bone",
      regionIds: ["head"],
      laterality: source.name.startsWith("left ")
        ? "left"
        : source.name.startsWith("right ")
          ? "right"
          : "midline",
      groupIds: ["skull-bones"],
      assetIds: [manifest.id],
      status: "available",
      provenance: [
        {
          sourceTitle: "BodyParts3D 4.0 — " + source.conceptId,
          sourceUrl: manifest.sourceUrl,
          license: manifest.licenseId,
          reviewStatus: "unreviewed",
        },
      ],
    };
  });
export const SKULL_BONE_MAPPINGS = layout.ranges.map((range) => ({
  ...range,
  id: "skull-" + range.conceptId.toLowerCase(),
  regionId: "head",
  sourceFiles: skull.sourceFiles.filter((file) =>
    skull.sourceConcepts
      .find((concept) => concept.conceptId === range.conceptId)!
      .fileIds.includes(file.id),
  ),
  sourceConcepts: skull.sourceConcepts.filter(
    (concept) => concept.conceptId === range.conceptId,
  ),
}));
export const SKULL_GROUP: AnatomyGroup = {
  id: "skull-bones",
  names: { en: "Skull bones", ro: "Oasele craniului" },
  memberIds: [...SKULL_BONE_STRUCTURES.map((bone) => bone.id), "mandible"],
};
