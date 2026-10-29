import { z } from "zod";
import type { AnatomyGroup, NervousStructure } from "@anatomy/core";
import manifest from "./nervous-manifest.json";

const division = z.enum(["cns", "pns", "associated"]);
const fn = z.enum([
  "somatic",
  "autonomic",
  "sympathetic",
  "parasympathetic",
  "enteric",
  "sensory",
  "motor",
  "mixed",
]);
const names = z.object({ en: z.string().min(1), ro: z.string().min(1) });
const bounds = z.object({
  min: z.tuple([z.number(), z.number(), z.number()]),
  max: z.tuple([z.number(), z.number(), z.number()]),
});
const source = z.object({
  conceptId: z.string().regex(/^FMA\d+$/),
  name: z.string(),
  fileIds: z.array(z.string()),
});
export const nervousManifestSchema = z.object({
  id: z.string(),
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
  triangleCount: z.number().int().positive(),
  sourceMeshCount: z.number().int().positive(),
  bounds,
  coordinateTransform: z.literal("[x/1000, z/1000, -y/1000]"),
  inventoryVersion: z.string(),
  anatomicallyComplete: z.literal(false),
  groups: z.array(
    z.object({ id: z.string(), key: z.string(), names, division }),
  ),
  structures: z.array(
    z.object({
      id: z.string(),
      names,
      latinName: z.string(),
      regionId: z.string(),
      laterality: z.enum(["left", "right", "midline", "bilateral", "none"]),
      sourceConcepts: z.array(source),
      sourceFiles: z.array(
        z.object({
          id: z.string(),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
        }),
      ),
      bounds,
      triangleCount: z.number().int().positive(),
    }),
  ),
  connections: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      relation: z.enum(["branches_into", "contributes_to", "related_to"]),
      sourceUrl: z.url(),
    }),
  ),
  inventory: z.array(
    z.object({
      id: z.string(),
      names,
      latinName: z.string(),
      laterality: z.enum(["left", "right", "midline", "bilateral", "none"]),
      group: z.string(),
      division,
      functions: z.array(fn),
      regionIds: z.array(z.string()),
      structureType: z.string(),
      parentId: z.string().optional(),
      geometryStatus: z.enum(["individual", "unavailable"]),
      gap: z.string().nullable(),
      note: z.string().nullable().optional(),
      cranialNumber: z.string().optional(),
      spinalDesignation: z.string().optional(),
      reviewStatus: z.literal("unreviewed"),
      medicalSource: z.url(),
      sourceConcepts: z.array(source),
      assetId: z.string().nullable(),
      meshIds: z.array(z.string()),
    }),
  ),
});
export const NERVOUS_ASSET = nervousManifestSchema.parse(manifest);
export const NERVOUS_INVENTORY = NERVOUS_ASSET.inventory;
export const nervousMetadataById = new Map(
  NERVOUS_INVENTORY.map((item) => [item.id, item]),
);
export const NERVOUS_STRUCTURES: readonly NervousStructure[] = [
  {
    id: "nervous-brain",
    names: {
      en: "Brain (available source parts)",
      ro: "Encefal (părți disponibile)",
    },
    latinName: "Encephalon",
    systemIds: ["nervous"],
    regionIds: ["head"],
    laterality: "midline",
    structureType: "brain_region",
    assetIds: [NERVOUS_ASSET.id],
    status: "available",
    division: "cns",
    functions: [],
    geometryStatus: "grouped",
    groupIds: ["nervous-group-brain"],
    provenance: [
      {
        sourceTitle: "BodyParts3D 4.0",
        sourceUrl: NERVOUS_ASSET.sourceUrl,
        license: NERVOUS_ASSET.licenseId,
        reviewStatus: "unreviewed",
      },
    ],
  },
  ...NERVOUS_INVENTORY.map((item) => ({
    id: item.id,
    names: item.names,
    latinName: item.latinName,
    systemIds: ["nervous"],
    structureType: item.structureType,
    regionIds: item.regionIds,
    parentId: item.parentId,
    groupIds: ["nervous-group-" + item.group],
    laterality: item.laterality,
    assetIds: item.assetId ? [item.assetId] : [],
    status: item.assetId ? ("available" as const) : ("unavailable" as const),
    division: item.division,
    functions: item.functions,
    geometryStatus: item.geometryStatus,
    synonyms: {
      en: [
        ...(item.cranialNumber
          ? [`CN ${item.cranialNumber}`, `cranial nerve ${item.cranialNumber}`]
          : []),
        ...(item.spinalDesignation ? [item.spinalDesignation] : []),
      ],
    },
    provenance: [
      {
        sourceTitle: item.assetId
          ? "BodyParts3D 4.0 / FIPAT terminology"
          : "FIPAT terminology — inventory only",
        sourceUrl: item.assetId ? NERVOUS_ASSET.sourceUrl : item.medicalSource,
        license: item.assetId
          ? NERVOUS_ASSET.licenseId
          : "Anatomical terms; reference only",
        reviewStatus: "unreviewed" as const,
      },
    ],
  })),
];
export const NERVOUS_GROUPS: readonly AnatomyGroup[] = NERVOUS_ASSET.groups.map(
  (group) => ({
    id: group.id,
    names: group.names,
    memberIds: NERVOUS_INVENTORY.filter(
      (item) => "nervous-group-" + item.group === group.id,
    ).map((item) => item.id),
  }),
);
const brainParts = NERVOUS_ASSET.structures.filter(
  (item) => nervousMetadataById.get(item.id)?.parentId === "nervous-brain",
);
export const NERVOUS_FOCUS_TARGETS = [
  ...NERVOUS_ASSET.structures,
  {
    id: "nervous-brain",
    regionId: "head",
    bounds: {
      min: [0, 1, 2].map((axis) =>
        Math.min(...brainParts.map((item) => item.bounds.min[axis]!)),
      ),
      max: [0, 1, 2].map((axis) =>
        Math.max(...brainParts.map((item) => item.bounds.max[axis]!)),
      ),
    },
  },
];
export const NERVOUS_COVERAGE = {
  catalog: NERVOUS_INVENTORY.length,
  individual: NERVOUS_INVENTORY.filter(
    (item) => item.geometryStatus === "individual",
  ).length,
  missing: NERVOUS_INVENTORY.filter(
    (item) => item.geometryStatus === "unavailable",
  ).length,
};
