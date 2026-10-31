import { z } from "zod";
import type {
  ArterialStructure,
  ArterialEdge,
  AnatomyGroup,
  AnatomicalStructure,
} from "@anatomy/core";
import raw from "./arterial-manifest.json";
import { CARDIAC_GEOMETRY, CARDIAC_STRUCTURES, CARDIAC_ASSETS } from "./heart";
const hash = z.string().regex(/^[a-f0-9]{64}$/),
  names = z.object({ en: z.string().min(1), ro: z.string().min(1) });
const bounds = z.object({
  min: z.tuple([z.number(), z.number(), z.number()]),
  max: z.tuple([z.number(), z.number(), z.number()]),
});
export const ARTERIAL_MANIFEST = z
  .object({
    version: z.string(),
    complete: z.literal(false),
    sourceVersion: z.string(),
    sourceUrl: z.url(),
    licenseId: z.literal("CC-BY-4.0"),
    licenseUrl: z.url(),
    attribution: z.string(),
    checkedAt: z.iso.date(),
    metadata: z.array(z.object({ filename: z.string(), sha256: hash })),
    registration: z.object({
      transform: z.literal("[x/1000,z/1000,-y/1000]"),
      landmarks: z.number().min(10),
      sourceDifferenceMm: z.literal(0),
      medicalReviewStatus: z.literal("pending"),
    }),
    assets: z.array(
      z.object({
        id: z.string(),
        uri: z.string().startsWith("/models/"),
        byteLength: z.number().positive(),
        sha256: hash,
        decodedBytes: z.number().positive(),
        structureIds: z.array(z.string()),
        triangleCount: z.number().positive(),
        region: z.string(),
        lod: z.union([z.literal(0), z.literal(1)]),
        format: z.literal("glb"),
        compression: z.string(),
        coordinateSystem: z.string(),
        dependencies: z.array(z.string()),
        medicalReviewStatus: z.literal("pending"),
        bounds,
      }),
    ),
    inventory: z.array(
      z.object({
        id: z.string(),
        terminologyId: z.string().regex(/^FMA\d+$/),
        names,
        group: z.string(),
        level: z.enum(["major", "named", "fine"]),
        parent: z.string().nullable(),
        laterality: z.enum(["left", "right", "midline", "bilateral", "none"]),
        sex: z.enum(["male", "unspecified"]),
        grouped: z.boolean().optional(),
        sourceName: z.string(),
        sourceConcepts: z.array(
          z.object({
            conceptId: z.string(),
            name: z.string(),
            fileIds: z.array(z.string()),
          }),
        ),
        sourceFiles: z.array(
          z.object({ id: z.string(), sha256: hash, geometryHash: hash }),
        ),
        sourceAliases: z.array(
          z.object({
            id: z.string(),
            duplicateOf: z.string(),
            sha256: hash,
            geometryHash: hash,
          }),
        ),
        bounds,
        triangleCount: z.number().positive(),
        assetId: z.string(),
        meshIds: z.array(z.string()),
        quality: z.object({
          boundaryEdges: z.number(),
          nonManifoldEdges: z.number(),
          degenerateTriangles: z.number(),
        }),
        medicalReviewStatus: z.literal("pending"),
        translationStatus: z.literal("pending-medical-review"),
      }),
    ),
    missing: z.array(z.object({ id: z.string(), names, group: z.string() })),
  })
  .parse(raw);
export const ARTERIAL_GROUP_NAMES: Readonly<
  Record<string, { en: string; ro: string }>
> = {
  aorta: { en: "Aorta and great vessels", ro: "Aortă și vase mari" },
  "head-neck": { en: "Head and neck", ro: "Cap și gât" },
  cerebral: { en: "Cerebral arteries", ro: "Artere cerebrale" },
  coronary: { en: "Coronary arteries", ro: "Artere coronare" },
  pulmonary: { en: "Pulmonary arteries", ro: "Artere pulmonare" },
  thoracic: { en: "Thoracic arteries", ro: "Artere toracice" },
  abdominal: { en: "Abdominal arteries", ro: "Artere abdominale" },
  renal: { en: "Renal arteries", ro: "Artere renale" },
  pelvic: { en: "Pelvic arteries", ro: "Artere pelvine" },
  "upper-limb": { en: "Upper limbs", ro: "Membre superioare" },
  "lower-limb": { en: "Lower limbs", ro: "Membre inferioare" },
  spinal: {
    en: "Spinal arteries (unavailable)",
    ro: "Artere spinale (indisponibile)",
  },
};
export const ARTERIAL_PALETTE: Readonly<Record<string, string>> = {
  aorta: "#d99480",
  "head-neck": "#cd9d62",
  cerebral: "#bd83c5",
  coronary: "#dc797d",
  pulmonary: "#789fc8",
  thoracic: "#dcaa83",
  abdominal: "#c4af6a",
  renal: "#93bda2",
  pelvic: "#b787a5",
  "upper-limb": "#6cb3ba",
  "lower-limb": "#9b9bd0",
  spinal: "#a2acb4",
};
export const ARTERIAL_NEW_GEOMETRY = ARTERIAL_MANIFEST.inventory.map((s) => ({
  ...s,
  regionId:
    s.group === "aorta" ||
    s.group === "coronary" ||
    s.group === "pulmonary" ||
    s.group === "thoracic"
      ? "thorax"
      : s.group === "head-neck"
        ? "neck"
        : s.group === "cerebral"
          ? "head"
          : s.group === "abdominal" || s.group === "renal"
            ? "abdomen"
            : s.group === "pelvic"
              ? "pelvis"
              : `${s.group}-${s.laterality}`,
}));
export const ARTERIAL_SHARED_IDS = new Set(
  CARDIAC_GEOMETRY.filter((s) => s.category === "artery").map((s) => s.id),
);
export const ARTERIAL_SHARED_GEOMETRY = CARDIAC_GEOMETRY.filter((s) =>
  ARTERIAL_SHARED_IDS.has(s.id),
).map((s) => ({
  ...s,
  group:
    s.id === "cardiac-fma8612"
      ? "pulmonary"
      : s.id === "cardiac-fma3736"
        ? "aorta"
        : "coronary",
  level: "major" as const,
  laterality:
    s.id === "cardiac-fma3802" || s.id === "cardiac-fma3840"
      ? ("right" as const)
      : s.id === "cardiac-fma3736" || s.id === "cardiac-fma8612"
        ? ("midline" as const)
        : ("left" as const),
  sex: "unspecified" as const,
  grouped: false,
}));
export const ARTERIAL_GEOMETRY = [
  ...ARTERIAL_NEW_GEOMETRY,
  ...ARTERIAL_SHARED_GEOMETRY,
];
export const arterialMetadataById = new Map(
  ARTERIAL_GEOMETRY.map((s) => [s.id, s]),
);
export const ARTERIAL_ASSETS = [
  ...ARTERIAL_MANIFEST.assets,
  ...CARDIAC_ASSETS.filter((a) =>
    a.structureIds.some((id) => ARTERIAL_SHARED_IDS.has(id)),
  ),
];
const provenance = [
  {
    sourceTitle: ARTERIAL_MANIFEST.sourceVersion,
    sourceUrl: ARTERIAL_MANIFEST.sourceUrl,
    license: ARTERIAL_MANIFEST.licenseId,
    reviewStatus: "unreviewed" as const,
  },
];
const newStructures: readonly ArterialStructure[] = ARTERIAL_NEW_GEOMETRY.map(
  (s) => ({
    id: s.id,
    names: s.names,
    synonyms: { en: [s.terminologyId, s.id], ro: [s.terminologyId, s.id] },
    systemIds: ["arterial"],
    structureType: s.grouped ? "arterial-set" : "artery",
    regionIds: [s.regionId],
    laterality: s.laterality,
    assetIds: [s.assetId],
    status: "available",
    provenance,
    arterialGroup: s.group,
    detail: s.level,
    circulation: s.group === "pulmonary" ? "pulmonary" : "systemic",
  }),
);
export const ARTERIAL_STRUCTURES: readonly ArterialStructure[] = [
  ...newStructures,
  ...CARDIAC_STRUCTURES.filter((s) => ARTERIAL_SHARED_IDS.has(s.id)).map(
    (s) => {
      const m = arterialMetadataById.get(s.id)!;
      return {
        ...s,
        laterality: m.laterality,
        arterialGroup: m.group,
        detail: m.level,
        circulation:
          m.group === "pulmonary"
            ? ("pulmonary" as const)
            : m.group === "coronary"
              ? ("coronary" as const)
              : ("systemic" as const),
      };
    },
  ),
];
export const ARTERIAL_MISSING: readonly AnatomicalStructure[] =
  ARTERIAL_MANIFEST.missing.map((s) => ({
    ...s,
    systemIds: ["arterial"],
    structureType: "arterial-target-family",
    regionIds: ["whole-body"],
    laterality: "none",
    assetIds: [],
    status: "unavailable",
    provenance,
  }));
// Shared cardiac records already exist in ANATOMY_CATALOG, no duplicate IDs.
export const ARTERIAL_CATALOG = [...newStructures, ...ARTERIAL_MISSING];
export const ARTERIAL_GROUPS: readonly AnatomyGroup[] = Object.entries(
  ARTERIAL_GROUP_NAMES,
).map(([key, names]) => ({
  id: `arterial-group-${key}`,
  names,
  memberIds: ARTERIAL_STRUCTURES.filter((s) => s.arterialGroup === key).map(
    (s) => s.id,
  ),
}));
export const ARTERIAL_COVERAGE = [
  ...ARTERIAL_GEOMETRY.map((s) => ({
    id: s.id,
    names: s.names,
    group: s.group,
    geometry: s.grouped ? ("set" as const) : ("individual" as const),
    sourceMapped: true,
    registration: "shared-source-frame" as const,
    connectivityReviewed: false,
    medicalReview: "pending" as const,
    selectable: true,
    assetId: s.assetId,
  })),
  ...ARTERIAL_MANIFEST.missing.map((s) => ({
    ...s,
    geometry: "missing" as const,
    sourceMapped: false,
    registration: "unavailable" as const,
    connectivityReviewed: false,
    medicalReview: "pending" as const,
    selectable: false,
    assetId: null,
  })),
];
const textbook =
  "https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways";
const continuations = new Set([
  "arterial-fma3768",
  "arterial-fma87217",
  "arterial-fma3789",
  "arterial-fma22655",
  "arterial-fma22656",
  "arterial-fma22691",
  "arterial-fma22692",
  "arterial-fma70249",
  "arterial-fma70250",
  "arterial-fma77380",
  "arterial-fma77381",
  "arterial-fma43916",
  "arterial-fma43917",
  "arterial-fma50369",
  "arterial-fma50370",
  "arterial-fma50641",
  "arterial-fma50642",
]);
export const ARTERIAL_EDGES: readonly ArterialEdge[] = [
  ...ARTERIAL_MANIFEST.inventory
    .filter((s) => s.parent)
    .map((s) => ({
      from: s.parent!,
      to: s.id,
      relation: continuations.has(s.id)
        ? ("continuation" as const)
        : ("branch" as const),
      sourceUrl: textbook,
      evidence: "source-backed" as const,
      medicalReview: "pending" as const,
    })),
  ...[
    ["cardiac-fma3736", "cardiac-fma3802"],
    ["cardiac-fma3736", "cardiac-fma3855"],
    ["cardiac-fma3855", "cardiac-fma74912"],
    ["cardiac-fma3855", "cardiac-fma3895"],
  ].map(([from, to]) => ({
    from: from!,
    to: to!,
    relation: "branch" as const,
    sourceUrl:
      "https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy",
    evidence: "source-backed" as const,
    medicalReview: "pending" as const,
  })),
  ...["arterial-fma3958", "arterial-fma4066"].map((from) => ({
    from,
    to: "arterial-fma50542",
    relation: "confluence" as const,
    sourceUrl: textbook,
    evidence: "source-backed" as const,
    medicalReview: "pending" as const,
  })),
  {
    from: "cardiac-fma3802",
    to: "cardiac-fma3840",
    relation: "branch",
    variant:
      "BodyParts3D source right-coronary posterior interventricular branch; not universal dominance",
    sourceUrl:
      "https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy",
    evidence: "source-backed",
    medicalReview: "pending",
  },
];
export const ARTERIAL_VARIANTS = [
  {
    id: "source-coronary-pattern",
    affectedIds: ["cardiac-fma3840"],
    geometry: "source-only",
    alternativesAvailable: false,
    medicalReview: "pending",
    sourceUrl: ARTERIAL_MANIFEST.sourceUrl,
  },
] as const;
