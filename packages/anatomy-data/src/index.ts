import { z } from "zod";
import type {
  AnatomicalStructure,
  AnatomyGroup,
  AnatomyRegion,
  AnatomySystem,
  Locale,
} from "@anatomy/core";
import skeletonManifest from "./skeleton-manifest.json";
import { MUSCLE_ASSET, MUSCLE_STRUCTURES, MUSCLE_GROUPS } from "./muscles";
import { SKULL_BONE_STRUCTURES, SKULL_GROUP } from "./skull";
import {
  NERVOUS_ASSETS,
  NERVOUS_STRUCTURES,
  NERVOUS_GROUPS,
  nervousMetadataById,
} from "./nervous";
export * from "./nervous";
export * from "./muscles";
export * from "./skull";
export * from "./skullVisualizationModes";

const boundsSchema = z.object({
  min: z.tuple([z.number(), z.number(), z.number()]),
  max: z.tuple([z.number(), z.number(), z.number()]),
});
export const skeletonManifestSchema = z.object({
  id: z.string().min(1),
  uri: z.string().startsWith("/models/"),
  sourceUrl: z.url(),
  sourceVersion: z.string(),
  licenseId: z.literal("CC-BY-4.0"),
  licenseUrl: z.url(),
  attribution: z.string(),
  checkedAt: z.iso.date(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  byteLength: z.number().positive(),
  gzipByteLength: z.number().positive(),
  compression: z.string(),
  rawByteLength: z.number().positive(),
  rawGzipByteLength: z.number().positive(),
  triangleCount: z.number().int().positive(),
  sourceMeshCount: z.number().int().positive(),
  bounds: boundsSchema,
  structures: z.array(
    z.object({
      id: z.string().min(1),
      names: z.object({ en: z.string().min(1), ro: z.string().min(1) }),
      latinName: z.string(),
      regionId: z.string(),
      laterality: z.enum(["left", "right", "midline", "bilateral", "none"]),
      sourceConcepts: z.array(
        z.object({
          conceptId: z.string().regex(/^FMA\d+$/),
          name: z.string(),
          fileIds: z.array(z.string()),
        }),
      ),
      sourceFiles: z.array(
        z.object({
          id: z.string().regex(/^FJ\d+$/),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
        }),
      ),
      bounds: boundsSchema,
      triangleCount: z.number().int().positive(),
    }),
  ),
});

export const SKELETON_ASSET = skeletonManifestSchema.parse(skeletonManifest);

export const SYSTEMS: readonly AnatomySystem[] = [
  {
    id: "skeletal",
    names: { en: "Skeletal system", ro: "Sistem osos" },
    color: "#e9dcc0",
    available: true,
    primary: true,
  },
  {
    id: "muscular",
    names: { en: "Muscular system", ro: "Sistem muscular" },
    color: "#d97378",
    available: true,
    primary: true,
  },
  {
    id: "nervous",
    names: { en: "Nervous system", ro: "Sistem nervos" },
    color: "#dfcf91",
    available: true,
    primary: true,
  },
  ...[
    ["arterial", "Arterial system", "Sistem arterial", "#ef4444"],
    ["venous", "Venous system", "Sistem venos", "#4777d9"],
    ["lymphatic", "Lymphatic system", "Sistem limfatic", "#72ba83"],
    ["respiratory", "Respiratory system", "Sistem respirator", "#79b9c2"],
    ["digestive", "Digestive system", "Sistem digestiv", "#c9885e"],
    ["endocrine", "Endocrine system", "Sistem endocrin", "#b77dd0"],
    ["urinary", "Urinary system", "Sistem urinar", "#79a8c7"],
    ["reproductive", "Reproductive system", "Sistem reproducător", "#d982a6"],
    ["integumentary", "Integumentary system", "Sistem tegumentar", "#d5a67f"],
  ].map(([id = "", en = "", ro = "", color = ""]) => ({
    id,
    names: { en, ro },
    color,
    available: false,
    primary: true,
  })),
];
export const AVAILABLE_SYSTEM_IDS = SYSTEMS.filter(
  (system) => system.available,
).map((system) => system.id);

export const REGIONS: readonly AnatomyRegion[] = [
  {
    id: "whole-body",
    names: { en: "Whole body", ro: "Corp întreg" },
    status: "available",
  },
  {
    id: "head",
    names: { en: "Head", ro: "Cap" },
    parentId: "whole-body",
    status: "available",
  },
  {
    id: "neck",
    names: { en: "Neck", ro: "Gât" },
    parentId: "whole-body",
    status: "available",
  },
  {
    id: "thorax",
    names: { en: "Thorax", ro: "Torace" },
    parentId: "whole-body",
    status: "available",
  },
  {
    id: "abdomen",
    names: { en: "Abdomen", ro: "Abdomen" },
    parentId: "whole-body",
    status: "available",
  },
  {
    id: "pelvis",
    names: { en: "Pelvis", ro: "Pelvis" },
    parentId: "whole-body",
    status: "available",
  },
  {
    id: "back",
    names: { en: "Back", ro: "Spate" },
    parentId: "whole-body",
    status: "available",
  },
  {
    id: "upper-limb-left",
    names: { en: "Left upper limb", ro: "Membru superior stâng" },
    parentId: "whole-body",
    status: "available",
  },
  {
    id: "upper-limb-right",
    names: { en: "Right upper limb", ro: "Membru superior drept" },
    parentId: "whole-body",
    status: "available",
  },
  {
    id: "lower-limb-left",
    names: { en: "Left lower limb", ro: "Membru inferior stâng" },
    parentId: "whole-body",
    status: "available",
  },
  {
    id: "lower-limb-right",
    names: { en: "Right lower limb", ro: "Membru inferior drept" },
    parentId: "whole-body",
    status: "available",
  },
];

export const STRUCTURES: readonly AnatomicalStructure[] =
  SKELETON_ASSET.structures.map((item) => ({
    id: item.id,
    names: item.names,
    latinName: item.latinName,
    systemIds: ["skeletal"],
    structureType: item.sourceConcepts.length > 1 ? "bone-group" : "bone",
    regionIds: [item.regionId],
    laterality: item.laterality,
    groupIds:
      item.id === "skull" || item.id === "mandible"
        ? ["skull-bones", "bodyparts3d-skeletal-set"]
        : ["bodyparts3d-skeletal-set"],
    ...(item.id === "skull"
      ? { childIds: SKULL_BONE_STRUCTURES.map((bone) => bone.id) }
      : {}),
    assetIds: [SKELETON_ASSET.id],
    status: "available",
    provenance: [
      {
        sourceTitle: "BodyParts3D 4.0 — Database Center for Life Science",
        sourceUrl: SKELETON_ASSET.sourceUrl,
        license: SKELETON_ASSET.licenseId,
        reviewStatus: "unreviewed",
      },
    ],
  }));

// STRUCTURES is deliberately the immutable skeletal compatibility boundary.
// Source manifest stays intact; skull children use audited source-index ranges.
export const SKELETAL_STRUCTURES = [...STRUCTURES, ...SKULL_BONE_STRUCTURES];
export const ANATOMY_CATALOG: readonly AnatomicalStructure[] = [
  ...SKELETAL_STRUCTURES,
  ...MUSCLE_STRUCTURES,
  ...NERVOUS_STRUCTURES,
];
export const GROUPS: readonly AnatomyGroup[] = [
  {
    id: "bodyparts3d-skeletal-set",
    names: { en: "Skeletal structures", ro: "Structuri osoase" },
    memberIds: STRUCTURES.map((item) => item.id),
    description: {
      en: "Skeletal structures in this BodyParts3D view. Skull bones can also be selected individually; vertebrae, ribs, hands, and feet remain grouped.",
      ro: "Structuri osoase din această vedere BodyParts3D. Oasele craniului se pot selecta și individual; vertebrele, coastele, mâinile și picioarele rămân grupate.",
    },
  },
  SKULL_GROUP,
  ...MUSCLE_GROUPS,
  ...NERVOUS_GROUPS,
];

export const assetManifestSchema = z.object({
  version: z.string(),
  assets: z.array(
    z.object({
      id: z.string().min(1),
      kind: z.enum(["development-fixture", "anatomical-model"]),
      uri: z.string(),
      structureIds: z.array(z.string().min(1)),
      licenseId: z.string().min(1),
    }),
  ),
});
export const ASSET_MANIFEST = assetManifestSchema.parse({
  version: "0.2.0",
  assets: [
    {
      id: SKELETON_ASSET.id,
      kind: "anatomical-model",
      uri: SKELETON_ASSET.uri,
      structureIds: SKELETAL_STRUCTURES.map((item) => item.id),
      licenseId: SKELETON_ASSET.licenseId,
    },
    {
      id: MUSCLE_ASSET.id,
      kind: "anatomical-model",
      uri: MUSCLE_ASSET.uri,
      structureIds: MUSCLE_ASSET.structures.map((item) => item.id),
      licenseId: MUSCLE_ASSET.licenseId,
    },
    ...NERVOUS_ASSETS.map((asset) => ({
      id: asset.id,
      kind: "anatomical-model",
      uri: asset.uri,
      structureIds: asset.structureIds.filter(
        (id) => nervousMetadataById.get(id)?.assetId === asset.id,
      ),
      licenseId: asset.licenseId,
    })),
  ],
});

export const structureById = new Map(
  ANATOMY_CATALOG.map((structure) => [structure.id, structure]),
);
export const systemById = new Map(SYSTEMS.map((system) => [system.id, system]));
export const regionById = new Map(REGIONS.map((region) => [region.id, region]));
export function searchStructures(
  query: string,
  locale: Locale,
): readonly AnatomicalStructure[] {
  const normalized = query.trim().toLocaleLowerCase(locale);
  if (!normalized) return ANATOMY_CATALOG;
  const exactDesignation =
    /^(?:(?:cn|cranial nerve)\s+(?:i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)|(?:c|t|l|s)\d{1,2}|co1)$/i.test(
      normalized,
    );
  return ANATOMY_CATALOG.filter((structure) =>
    [
      structure.names.en,
      structure.names.ro,
      structure.latinName,
      ...(structure.synonyms?.en ?? []),
      ...(structure.synonyms?.ro ?? []),
    ].some((term) =>
      exactDesignation
        ? term?.toLocaleLowerCase(locale) === normalized
        : term?.toLocaleLowerCase(locale).includes(normalized),
    ),
  );
}
