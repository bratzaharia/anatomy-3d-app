import { z } from "zod";
import type { AnatomyGroup, VenousStructure } from "@anatomy/core";
import data from "./venous-manifest.json";
const names = z.object({ en: z.string().min(1), ro: z.string().min(1) });
const bounds = z.object({
  min: z.tuple([z.number(), z.number(), z.number()]),
  max: z.tuple([z.number(), z.number(), z.number()]),
});
const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const venousManifestSchema = z.object({
  id: z.string(),
  version: z.string(),
  anatomicallyComplete: z.literal(false),
  sourceUrl: z.url(),
  sourceVersion: z.string(),
  licenseId: z.literal("CC-BY-4.0"),
  licenseUrl: z.url(),
  attribution: z.string(),
  checkedAt: z.iso.date(),
  coordinateTransform: z.array(z.number()).length(16),
  registration: z.object({
    method: z.string(),
    rmsMm: z.literal(0),
    maxMm: z.literal(0),
    clinicalReview: z.literal("pending"),
    landmarks: z
      .array(
        z.object({
          id: z.string(),
          sourceFile: z.string(),
          geometryHash: sha,
          sourceDifferenceMm: z.literal(0),
        }),
      )
      .min(10),
  }),
  acquisition: z.array(
    z.object({
      filename: z.string(),
      url: z.url(),
      byteLength: z.number().positive(),
      sha256: sha,
    }),
  ),
  groups: z.array(z.object({ id: z.string(), key: z.string(), names })),
  assets: z.array(
    z.object({
      id: z.string(),
      region: z.string(),
      uri: z.string().startsWith("/models/"),
      version: z.string(),
      format: z.literal("glb"),
      compression: z.string(),
      lod: z.literal(0),
      dependencies: z.array(z.string()),
      coordinateSystem: z.string(),
      byteLength: z.number().positive(),
      sha256: sha,
      decodedBytes: z.number().positive(),
      structureIds: z.array(z.string()),
      triangleCount: z.number().int().positive(),
      bounds,
      licenseId: z.literal("CC-BY-4.0"),
      validationStatus: z.literal("unverified"),
    }),
  ),
  inventory: z.array(
    z.object({
      id: z.string(),
      names,
      latinName: z.string(),
      laterality: z.enum(["left", "right", "midline", "bilateral", "none"]),
      group: z.string(),
      regionIds: z.array(z.string()),
      venousCategory: z.enum([
        "vein",
        "dural-sinus",
        "cardiac-sinus",
        "plexus",
        "microanatomy",
      ]),
      territory: z.enum(["systemic", "portal", "pulmonary", "cardiac"]),
      depth: z.enum(["superficial", "deep", "perforating", "unknown"]),
      sex: z.enum(["male-reference", "female-only"]),
      representation: z.enum(["individual", "set"]),
      sourceName: z.string().nullable(),
      terminologyId: z
        .string()
        .regex(/^FMA\d+$/)
        .nullable(),
      terminologyVersion: z.string(),
      medicalSource: z.url(),
      sourceConcepts: z.array(
        z.object({
          conceptId: z.string(),
          name: z.string(),
          fileIds: z.array(z.string()),
        }),
      ),
      sourceFiles: z.array(z.object({ id: z.string(), sha256: sha })),
      assetId: z.string().nullable(),
      meshIds: z.array(z.string()),
      geometryType: z.enum(["none", "surface-mesh"]),
      geometryStatus: z.enum(["individual", "grouped", "unavailable"]),
      validationStatus: z.literal("unverified"),
      reviewedBy: z.null(),
      reviewDate: z.null(),
      translationStatus: z.literal("pending-medical-review"),
      missingReason: z.string().nullable(),
      bounds: bounds.nullable(),
      triangleCount: z.number().int().nonnegative(),
      quality: z
        .object({
          boundaryEdges: z.number(),
          nonManifoldEdges: z.number(),
          degenerateTriangles: z.number(),
        })
        .optional(),
    }),
  ),
  connections: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      relation: z.enum(["drains-into", "microcirculatory-transition"]),
      sourceUrl: z.url(),
      validationStatus: z.literal("unverified"),
      evidence: z.string(),
    }),
  ),
  collectionPoints: z.array(z.object({ id: z.string(), names })),
  quality: z.object({
    boundaryEdges: z.number(),
    nonManifoldEdges: z.number(),
    degenerateTriangles: z.number(),
  }),
});
export const VENOUS_MANIFEST = venousManifestSchema.parse(data);
export const VENOUS_ASSETS = VENOUS_MANIFEST.assets;
export const VENOUS_INVENTORY = VENOUS_MANIFEST.inventory;
export const venousMetadataById = new Map(
  VENOUS_INVENTORY.map((s) => [s.id, s]),
);
export const VENOUS_STRUCTURES: readonly VenousStructure[] =
  VENOUS_INVENTORY.map((s) => ({
    id: s.id,
    names: s.names,
    latinName: s.latinName,
    synonyms: {
      en: [
        s.id,
        ...(s.terminologyId ? [s.terminologyId] : []),
        ...(s.sourceName ? [s.sourceName] : []),
      ],
      ro: s.terminologyId ? [s.terminologyId] : [],
    },
    systemIds: ["venous"],
    structureType: s.venousCategory,
    regionIds: s.regionIds,
    groupIds: ["venous-group-" + s.group],
    laterality: s.laterality,
    assetIds: s.assetId ? [s.assetId] : [],
    status: s.assetId ? "available" : "unavailable",
    venousGroup: s.group,
    venousCategory: s.venousCategory,
    depth: s.depth,
    territory: s.territory,
    provenance: [
      {
        sourceTitle: s.assetId
          ? "BodyParts3D 4.0"
          : "Macroscopic target — terminology review pending",
        sourceUrl: s.assetId ? VENOUS_MANIFEST.sourceUrl : s.medicalSource,
        license: s.assetId ? VENOUS_MANIFEST.licenseId : "No model distributed",
        reviewStatus: "unreviewed",
      },
    ],
  }));
export const VENOUS_GROUPS: readonly AnatomyGroup[] =
  VENOUS_MANIFEST.groups.map((g) => ({
    ...g,
    memberIds: VENOUS_INVENTORY.filter((s) => s.group === g.key).map(
      (s) => s.id,
    ),
  }));
export const VENOUS_GEOMETRY = VENOUS_INVENTORY.flatMap((s) =>
  s.assetId && s.bounds
    ? [{ ...s, regionId: s.regionIds[0]!, bounds: s.bounds }]
    : [],
);
export const VENOUS_COVERAGE = {
  catalog: VENOUS_INVENTORY.length,
  individual: VENOUS_INVENTORY.filter((s) => s.geometryStatus === "individual")
    .length,
  grouped: VENOUS_INVENTORY.filter((s) => s.geometryStatus === "grouped")
    .length,
  missing: VENOUS_INVENTORY.filter((s) => !s.assetId).length,
};
export const VENOUS_CONNECTIONS = VENOUS_MANIFEST.connections;
export const venousGraphNames = new Map(
  [...VENOUS_INVENTORY, ...VENOUS_MANIFEST.collectionPoints].map((s) => [
    s.id,
    s.names,
  ]),
);
