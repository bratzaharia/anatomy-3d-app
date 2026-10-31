import { z } from "zod";
import type {
  AnatomicalStructure,
  AnatomyGroup,
  CardiacEdge,
  CardiacGroup,
  CardiacStructure,
} from "@anatomy/core";
import manifest from "./heart-manifest.json";
import {
  VENOUS_INVENTORY,
  VENOUS_CONNECTIONS,
  VENOUS_MANIFEST,
} from "./venous";
const names = z.object({ en: z.string().min(1), ro: z.string().min(1) }),
  hash = z.string().regex(/^[a-f0-9]{64}$/);
const bounds = z.object({
  min: z.tuple([z.number(), z.number(), z.number()]),
  max: z.tuple([z.number(), z.number(), z.number()]),
});
export const HEART_MANIFEST = z
  .object({
    version: z.string(),
    complete: z.literal(false),
    sourceVersion: z.string(),
    sourceUrl: z.url(),
    licenseId: z.literal("CC-BY-4.0"),
    licenseUrl: z.url(),
    attribution: z.string(),
    checkedAt: z.iso.date(),
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
        triangleCount: z.number().int().positive(),
      }),
    ),
    inventory: z.array(
      z.object({
        id: z.string(),
        terminologyId: z.string().regex(/^FMA\d+$/),
        names,
        latinName: z.string(),
        category: z.enum(["wall", "cavity", "valve", "papillary", "artery"]),
        group: z.enum([
          "walls",
          "cavities",
          "valves",
          "papillary",
          "coronary-arteries",
          "great-arteries",
        ]),
        valve: z.string().optional(),
        sourceTable: z.enum(["IS-A", "PART-OF"]),
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
        bounds,
        triangleCount: z.number().int().positive(),
        assetId: z.string(),
        meshIds: z.array(z.string()),
        geometryRepresentation: z.enum([
          "cavity-surface-not-wall",
          "source-surface",
        ]),
        geometryValidationStatus: z.literal("source-mapped-unverified"),
        medicalReviewStatus: z.literal("pending"),
        translationStatus: z.literal("pending-medical-review"),
        quality: z.object({
          boundaryEdges: z.number(),
          nonManifoldEdges: z.number(),
          degenerateTriangles: z.number(),
        }),
      }),
    ),
    missing: z.array(
      z.object({ id: z.string(), names, latinName: z.string() }),
    ),
  })
  .parse(manifest);
export const CARDIAC_ASSETS = HEART_MANIFEST.assets;
export const CARDIAC_GEOMETRY = HEART_MANIFEST.inventory.map((s) => ({
  ...s,
  regionId: "thorax",
}));
export const cardiacMetadataById = new Map(
  CARDIAC_GEOMETRY.map((s) => [s.id, s]),
);
export const CARDIAC_GROUP_NAMES: Record<
  CardiacGroup,
  { en: string; ro: string }
> = {
  walls: { en: "Source heart walls", ro: "Pereți cardiaci din sursă" },
  cavities: {
    en: "Chamber cavities — not walls",
    ro: "Cavități cardiace — nu pereți",
  },
  valves: { en: "Valve leaflets and cusps", ro: "Foițe și cuspe valvulare" },
  papillary: { en: "Papillary muscles", ro: "Mușchi papilari" },
  "coronary-arteries": { en: "Coronary arteries", ro: "Artere coronare" },
  "great-arteries": {
    en: "Great arterial connections",
    ro: "Conexiuni arteriale mari",
  },
};
const provenance = {
  sourceTitle: HEART_MANIFEST.sourceVersion,
  sourceUrl: HEART_MANIFEST.sourceUrl,
  license: HEART_MANIFEST.licenseId,
  reviewStatus: "unreviewed" as const,
};
export const CARDIAC_STRUCTURES: readonly CardiacStructure[] =
  CARDIAC_GEOMETRY.map((s) => ({
    id: s.id,
    names: s.names,
    latinName: s.latinName,
    synonyms: { en: [s.sourceName, s.terminologyId], ro: [s.terminologyId] },
    cardiacGroup: s.group,
    systemIds: [s.category === "artery" ? "arterial" : "cardiac"],
    structureType:
      s.category === "artery"
        ? "artery"
        : s.category === "cavity"
          ? "cardiac-cavity"
          : s.category === "valve"
            ? "cardiac-valve-leaflet"
            : s.category === "papillary"
              ? "cardiac-papillary-muscle"
              : "cardiac-wall",
    regionIds: ["thorax"],
    parentId: s.valve
      ? `cardiac-valve-${s.valve}`
      : s.category === "artery"
        ? undefined
        : "cardiac-heart",
    groupIds: [`cardiac-group-${s.group}`],
    laterality: "none",
    assetIds: [s.assetId],
    status: "available",
    provenance: [provenance],
  }));
const valveLabels = [
  [
    "tricuspid",
    "Tricuspid valve — source leaflets",
    "Valva tricuspidă — foițe din sursă",
    "Valva tricuspidalis",
  ],
  [
    "mitral",
    "Mitral valve — source leaflets",
    "Valva mitrală — foițe din sursă",
    "Valva mitralis",
  ],
  [
    "pulmonary",
    "Pulmonary valve — source cusps",
    "Valva pulmonară — cuspe din sursă",
    "Valva trunci pulmonalis",
  ],
  [
    "aortic",
    "Aortic valve — source cusps",
    "Valva aortică — cuspe din sursă",
    "Valva aortae",
  ],
];
export const CARDIAC_SELECTORS: readonly AnatomicalStructure[] = [
  {
    id: "cardiac-heart",
    names: {
      en: "Heart — available source subset",
      ro: "Inimă — subset disponibil din sursă",
    },
    latinName: "Cor",
    systemIds: ["cardiac"],
    structureType: "organ",
    regionIds: ["thorax"],
    laterality: "none",
    assetIds: CARDIAC_ASSETS.filter((a) => !a.id.includes("arterial")).map(
      (a) => a.id,
    ),
    status: "available",
    provenance: [provenance],
  },
  ...valveLabels.map(([key, en, ro, latinName]) => ({
    id: `cardiac-valve-${key}`,
    names: { en: en!, ro: ro! },
    latinName,
    systemIds: ["cardiac"],
    structureType: "cardiac-valve",
    parentId: "cardiac-heart",
    regionIds: ["thorax"],
    laterality: "none" as const,
    assetIds: ["bodyparts3d-heart-internal-v4"],
    status: "available" as const,
    provenance: [provenance],
  })),
];
export const CARDIAC_MISSING: readonly AnatomicalStructure[] =
  HEART_MANIFEST.missing.map((s) => ({
    ...s,
    systemIds: [
      s.id === "cardiac-missing-smallest-cardiac-veins" ? "venous" : "cardiac",
    ],
    structureType:
      s.id === "cardiac-missing-smallest-cardiac-veins"
        ? "vein"
        : "cardiac-inventory",
    regionIds: ["thorax"],
    laterality: "none",
    assetIds: [],
    status: "unavailable",
    provenance: [
      {
        sourceTitle: "Cardiac acquisition target — no model",
        sourceUrl:
          "https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy",
        license: "No model distributed",
        reviewStatus: "unreviewed",
      },
    ],
  }));
export const CARDIAC_CATALOG = [
  ...CARDIAC_SELECTORS,
  ...CARDIAC_STRUCTURES,
  ...CARDIAC_MISSING,
];
export const CARDIAC_GROUPS: readonly AnatomyGroup[] = Object.entries(
  CARDIAC_GROUP_NAMES,
).map(([group, names]) => ({
  id: `cardiac-group-${group}`,
  names,
  memberIds: CARDIAC_STRUCTURES.filter((s) => s.cardiacGroup === group).map(
    (s) => s.id,
  ),
}));
export const CARDIAC_VENOUS_IDS = VENOUS_INVENTORY.filter(
  (v) =>
    ["cardiac", "pulmonary"].includes(v.group) ||
    ["venous-superior-vena-cava", "venous-inferior-vena-cava"].includes(v.id),
).map((v) => v.id);
// Reuse exact venous identities; never pack a second copy in a cardiac GLB.
const reference =
  "https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy";
const edge = (
  from: string,
  to: string,
  relation: CardiacEdge["relation"] = "flow",
  variant?: string,
): CardiacEdge => ({
  from,
  to,
  relation,
  sourceUrl: reference,
  reviewStatus: "pending",
  ...(variant ? { variant } : {}),
});
export const CARDIAC_GRAPH: readonly CardiacEdge[] = [
  ...[
    "venous-superior-vena-cava",
    "venous-inferior-vena-cava",
    "venous-coronary-sinus",
    "venous-anterior-cardiac-vein",
  ].map((id) => edge(id, "cardiac-fma11359")),
  ...[
    "venous-great-cardiac-vein",
    "venous-middle-cardiac-vein",
    "venous-small-cardiac-vein",
    "venous-posterior-vein-of-left-ventricle",
  ].map((id) => edge(id, "venous-coronary-sinus")),
  ...["left", "right"].flatMap((side) =>
    ["superior", "inferior"].map((level) =>
      edge(`venous-${side}-${level}-pulmonary-vein`, "cardiac-fma9465"),
    ),
  ),
  edge("cardiac-fma11359", "cardiac-valve-tricuspid"),
  edge("cardiac-valve-tricuspid", "cardiac-fma9291"),
  edge("cardiac-fma9291", "cardiac-valve-pulmonary"),
  edge("cardiac-valve-pulmonary", "cardiac-fma8612"),
  edge(
    "cardiac-fma8612",
    "cardiac-concept-pulmonary-microcirculation",
    "microcirculation",
  ),
  ...["left", "right"].flatMap((side) =>
    ["superior", "inferior"].map((level) =>
      edge(
        "cardiac-concept-pulmonary-microcirculation",
        `venous-${side}-${level}-pulmonary-vein`,
        "microcirculation",
      ),
    ),
  ),
  edge("cardiac-fma9465", "cardiac-valve-mitral"),
  edge("cardiac-valve-mitral", "cardiac-fma9466"),
  edge("cardiac-fma9466", "cardiac-valve-aortic"),
  edge("cardiac-valve-aortic", "cardiac-fma3736"),
  edge("cardiac-fma3736", "cardiac-fma3802"),
  edge("cardiac-fma3736", "cardiac-fma3855"),
  edge("cardiac-fma3855", "cardiac-fma74912"),
  edge("cardiac-fma3855", "cardiac-fma3895"),
  edge(
    "cardiac-fma3802",
    "cardiac-fma3840",
    "flow",
    "Source subject only; posterior descending origin varies",
  ),
];
export const CARDIAC_GRAPH_CONCEPTS = [
  {
    id: "cardiac-concept-pulmonary-microcirculation",
    names: {
      en: "Pulmonary microcirculation — concept, no mesh",
      ro: "Microcirculație pulmonară — concept, fără model",
    },
  },
];
export const CARDIAC_PATHS = {
  systemic: [
    "venous-superior-vena-cava",
    "cardiac-fma11359",
    "cardiac-valve-tricuspid",
    "cardiac-fma9291",
    "cardiac-valve-pulmonary",
    "cardiac-fma8612",
  ],
  pulmonary: [
    "venous-left-superior-pulmonary-vein",
    "cardiac-fma9465",
    "cardiac-valve-mitral",
    "cardiac-fma9466",
    "cardiac-valve-aortic",
    "cardiac-fma3736",
  ],
  coronary: [
    "venous-great-cardiac-vein",
    "venous-coronary-sinus",
    "cardiac-fma11359",
  ],
} as const;
export const cardiacNameById = new Map(
  [
    ...CARDIAC_CATALOG,
    ...VENOUS_INVENTORY,
    ...VENOUS_MANIFEST.collectionPoints,
    ...CARDIAC_GRAPH_CONCEPTS,
  ].map((s) => [s.id, s.names]),
);
// Follow explicitly curated drainage edges; never infer a route from geometry.
// Cardiac endpoints supersede the older no-model atrial collection placeholders.
export function cardiacVenousRoute(start: string): readonly string[] {
  const edges = [
    ...CARDIAC_GRAPH,
    ...VENOUS_CONNECTIONS.filter(
      (e) => !CARDIAC_GRAPH.some((c) => c.from === e.from),
    ),
  ];
  const queue: string[][] = [[start]],
    seen = new Set<string>();
  while (queue.length) {
    const path = queue.shift()!,
      id = path.at(-1)!;
    if (seen.has(id)) continue;
    seen.add(id);
    if (id === "cardiac-fma11359" || id === "cardiac-fma9465") return path;
    for (const e of edges) if (e.from === id) queue.push([...path, e.to]);
  }
  return [];
}
