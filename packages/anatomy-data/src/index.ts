import { z } from "zod";
import type {
  AnatomicalStructure,
  AnatomyGroup,
  AnatomyRegion,
  AnatomySystem,
  Locale,
} from "@anatomy/core";
import skeletonManifest from "./skeleton-manifest.json";

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
  ...[
    ["muscular", "Muscular system", "Sistem muscular", "#d97378"],
    ["nervous", "Nervous system", "Sistem nervos", "#f4ca64"],
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
    status: "planned",
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
    groupIds: ["bodyparts3d-skeletal-set"],
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

export const GROUPS: readonly AnatomyGroup[] = [
  {
    id: "bodyparts3d-skeletal-set",
    names: { en: "Skeletal structures", ro: "Structuri osoase" },
    memberIds: STRUCTURES.map((item) => item.id),
    description: {
      en: "All selectable structures in this BodyParts3D skeletal view. Skull, vertebrae, ribs, hands, and feet are selected as groups.",
      ro: "Toate structurile selectabile din această vedere BodyParts3D. Craniul, vertebrele, coastele, mâinile și picioarele se selectează ca grupuri.",
    },
  },
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
      structureIds: STRUCTURES.map((item) => item.id),
      licenseId: SKELETON_ASSET.licenseId,
    },
  ],
});

export const structureById = new Map(
  STRUCTURES.map((structure) => [structure.id, structure]),
);
export const systemById = new Map(SYSTEMS.map((system) => [system.id, system]));
export const regionById = new Map(REGIONS.map((region) => [region.id, region]));
export function searchStructures(
  query: string,
  locale: Locale,
): readonly AnatomicalStructure[] {
  const normalized = query.trim().toLocaleLowerCase(locale);
  if (!normalized) return STRUCTURES;
  return STRUCTURES.filter((structure) =>
    [
      structure.names.en,
      structure.names.ro,
      structure.latinName,
      ...(structure.synonyms?.en ?? []),
      ...(structure.synonyms?.ro ?? []),
    ].some((term) => term?.toLocaleLowerCase(locale).includes(normalized)),
  );
}
