import { z } from "zod";
import type { AnatomicalStructure, AnatomyGroup } from "@anatomy/core";
import manifest from "./muscle-manifest.json";

const bounds = z.object({
  min: z.tuple([z.number(), z.number(), z.number()]),
  max: z.tuple([z.number(), z.number(), z.number()]),
});
const source = z.object({
  conceptId: z.string().regex(/^FMA\d+$/),
  name: z.string(),
  fileIds: z.array(z.string().regex(/^FJ\d+M?$/)),
});
export const muscleManifestSchema = z.object({
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
    z.object({
      id: z.string(),
      region: z.string(),
      names: z.object({ en: z.string(), ro: z.string() }),
      depth: z.enum(["superficial", "intermediate", "deep", "mixed"]),
    }),
  ),
  structures: z.array(
    z.object({
      id: z.string(),
      names: z.object({ en: z.string(), ro: z.string() }),
      latinName: z.string(),
      regionId: z.string(),
      laterality: z.enum(["left", "right", "midline", "bilateral", "none"]),
      sourceConcepts: z.array(source),
      sourceFiles: z.array(
        z.object({
          id: z.string().regex(/^FJ\d+M?$/),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
        }),
      ),
      bounds,
      triangleCount: z.number().int().positive(),
    }),
  ),
  inventory: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      en: z.string(),
      ro: z.string(),
      latin: z.string(),
      region: z.string(),
      group: z.string(),
      side: z.enum(["left", "right", "midline", "bilateral", "none"]),
      depth: z.enum(["superficial", "intermediate", "deep", "mixed"]),
      mappingStatus: z.enum([
        "independent",
        "grouped",
        "grouped-only",
        "missing",
      ]),
      groupedIn: z.string().nullable(),
      gap: z.string().nullable(),
      reviewStatus: z.literal("unreviewed"),
      medicalSource: z.url(),
      sourceConcepts: z.array(source),
      assetId: z.string().nullable(),
      meshIds: z.array(z.string()),
    }),
  ),
});
export const MUSCLE_ASSET = muscleManifestSchema.parse(manifest);
export const MUSCLE_INVENTORY = MUSCLE_ASSET.inventory;
export const muscleMetadataById = new Map(
  MUSCLE_INVENTORY.map((item) => [item.id, item]),
);
const quadricepsNames = new Set([
  "rectus femoris",
  "vastus lateralis",
  "vastus medialis",
  "vastus intermedius",
]);
export const MUSCLE_STRUCTURES: readonly AnatomicalStructure[] =
  MUSCLE_INVENTORY.map((item) => ({
    id: item.id,
    names: { en: item.en, ro: item.ro },
    latinName: item.latin,
    systemIds: ["muscular"],
    regionIds: [item.region],
    groupIds: [
      "muscle-group-" + item.group,
      ...(quadricepsNames.has(item.name) ? ["muscle-group-quadriceps"] : []),
    ],
    structureType: item.mappingStatus === "grouped" ? "muscle-set" : "muscle",
    laterality: item.side,
    assetIds: item.assetId ? [item.assetId] : [],
    status: item.assetId ? "available" : "unavailable",
    provenance: [
      {
        sourceTitle: "BodyParts3D 4.0 / FIPAT TA2 (inventory)",
        sourceUrl: item.assetId ? MUSCLE_ASSET.sourceUrl : item.medicalSource,
        license: item.assetId
          ? MUSCLE_ASSET.licenseId
          : "Public-domain anatomical terms",
        reviewStatus: "unreviewed",
      },
    ],
  }));
const regionalGroups: readonly AnatomyGroup[] = MUSCLE_ASSET.groups.map(
  (group) => ({
    id: group.id,
    names: group.names,
    memberIds: MUSCLE_STRUCTURES.filter((item) =>
      item.groupIds?.includes(group.id),
    ).map((item) => item.id),
  }),
);
export const MUSCLE_GROUPS: readonly AnatomyGroup[] = [
  ...regionalGroups,
  {
    id: "muscle-group-quadriceps",
    parentId: "muscle-group-thighAnterior",
    names: {
      en: "Thigh — anterior compartment — quadriceps femoris",
      ro: "Coapsă — compartiment anterior — cvadriceps femural",
    },
    memberIds: MUSCLE_STRUCTURES.filter((item) =>
      item.groupIds?.includes("muscle-group-quadriceps"),
    ).map((item) => item.id),
  },
];
export const MUSCLE_COVERAGE = {
  independent: MUSCLE_INVENTORY.filter((i) => i.mappingStatus === "independent")
    .length,
  sets: MUSCLE_INVENTORY.filter((i) => i.mappingStatus === "grouped").length,
  groupedOnly: MUSCLE_INVENTORY.filter(
    (i) => i.mappingStatus === "grouped-only",
  ).length,
  missing: MUSCLE_INVENTORY.filter((i) => i.mappingStatus === "missing").length,
};
