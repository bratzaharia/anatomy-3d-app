import type { BrainPalette, BrainStyle } from "@anatomy/core";
import { NERVOUS_ASSET, NERVOUS_INVENTORY } from "./nervous";

export const BRAIN_SOURCE = {
  assetId: NERVOUS_ASSET.id,
  sha256: NERVOUS_ASSET.sha256,
  sourceUrl: NERVOUS_ASSET.sourceUrl,
  licenseId: NERVOUS_ASSET.licenseId,
  reviewStatus: "unreviewed" as const,
};
// Presentation grouping of exact existing source concepts, not a cortical atlas
// or a claim that a group contains a complete lobe/hemisphere. Cross-lobar gyri
// deliberately have their own group (see FreeSurfer's lobe-mapping caveat).
export const BRAIN_CATEGORIES = [
  {
    id: "frontal",
    names: {
      en: "Frontal cortex — available parts",
      ro: "Cortex frontal — părți disponibile",
    },
    stems: [
      "superior-frontal-gyrus",
      "middle-frontal-gyrus",
      "inferior-frontal-gyrus",
      "precentral-gyrus",
    ],
  },
  {
    id: "parietal",
    names: {
      en: "Parietal cortex — available parts",
      ro: "Cortex parietal — părți disponibile",
    },
    stems: [
      "postcentral-gyrus",
      "supramarginal-gyrus",
      "angular-gyrus",
      "superior-parietal-lobule",
    ],
  },
  {
    id: "temporal",
    names: {
      en: "Temporal cortex — available parts",
      ro: "Cortex temporal — părți disponibile",
    },
    stems: ["middle-temporal-gyrus", "inferior-temporal-gyrus"],
  },
  {
    id: "cross-lobar",
    names: {
      en: "Cross-lobar / limbic cortical parts",
      ro: "Părți corticale trans-lobare / limbice",
    },
    stems: ["fusiform-gyrus", "parahippocampal-gyrus", "cingulate-gyrus"],
  },
  {
    id: "occipital",
    names: {
      en: "Occipital lobes — source meshes",
      ro: "Lobi occipitali — geometrii-sursă",
    },
    stems: ["occipital-lobe"],
  },
  {
    id: "insula",
    names: { en: "Insular cortex", ro: "Cortex insular" },
    stems: ["insula"],
  },
  {
    id: "deep-gray",
    names: {
      en: "Deep gray-matter structures",
      ro: "Structuri profunde de substanță cenușie",
    },
    stems: [
      "hippocampus",
      "amygdala",
      "caudate-nucleus",
      "putamen",
      "globus-pallidus",
    ],
  },
  {
    id: "white-matter",
    names: { en: "White-matter structures", ro: "Structuri de substanță albă" },
    stems: [
      "internal-capsule",
      "fornix-of-forebrain",
      "corpus-callosum",
      "optic-chiasm",
    ],
  },
  {
    id: "diencephalon",
    names: {
      en: "Diencephalon — available parts",
      ro: "Diencefal — părți disponibile",
    },
    stems: ["thalamus", "hypothalamus"],
  },
  {
    id: "brainstem",
    names: { en: "Brainstem", ro: "Trunchi cerebral" },
    stems: ["midbrain", "pons", "medulla-oblongata"],
  },
  {
    id: "cerebellum",
    names: {
      en: "Cerebellum — whole source part",
      ro: "Cerebel — parte-sursă întreagă",
    },
    stems: ["cerebellum"],
  },
] as const;
export type BrainCategory = (typeof BRAIN_CATEGORIES)[number]["id"];
export const BRAIN_REGIONS = NERVOUS_INVENTORY.filter(
  (s) => s.parentId === "nervous-brain" && s.assetId === NERVOUS_ASSET.id,
).map((s) => {
  const stem = s.id.replace(/^nervous-/, "").replace(/-(left|right)$/, "");
  const category = BRAIN_CATEGORIES.find((g) =>
    (g.stems as readonly string[]).includes(stem),
  );
  if (!category) throw Error("Unclassified source brain part: " + s.id);
  const homologueId =
    s.laterality === "left"
      ? s.id.replace(/-left$/, "-right")
      : s.laterality === "right"
        ? s.id.replace(/-right$/, "-left")
        : null;
  return {
    ...s,
    category: category.id,
    homologueId,
    terminologyIds: s.sourceConcepts.map((c) => c.conceptId),
    mappingStatus: "source-identified" as const,
    atlasId: null,
  };
});
export const brainRegionById = new Map(BRAIN_REGIONS.map((s) => [s.id, s]));
export const BRAIN_IDS = BRAIN_REGIONS.map((s) => s.id);
export interface BrainTreeNode {
  readonly id: string;
  readonly names: { readonly en: string; readonly ro: string };
  readonly memberIds: readonly string[];
  readonly children: readonly BrainTreeNode[];
}
const cortexIds = new Set<string>([
  "frontal",
  "parietal",
  "temporal",
  "cross-lobar",
  "occipital",
  "insula",
]);
function categories(side?: "left" | "right", cortex = true): BrainTreeNode[] {
  return BRAIN_CATEGORIES.filter((g) => cortexIds.has(g.id) === cortex).map(
    (g) => ({
      id: `brain-group-${g.id}${side ? "-" + side : ""}`,
      names: g.names,
      memberIds: BRAIN_REGIONS.filter(
        (s) => s.category === g.id && (!side || s.laterality === side),
      ).map((s) => s.id),
      children: [],
    }),
  );
}
export const BRAIN_TREE: readonly BrainTreeNode[] = [
  ...(["left", "right"] as const).map((side) => {
    const children = categories(side);
    return {
      id: `brain-cortex-${side}`,
      names: {
        en: `${side === "left" ? "Left" : "Right"} cerebral cortex — available parts`,
        ro: `Cortex cerebral ${side === "left" ? "stâng" : "drept"} — părți disponibile`,
      },
      children,
      memberIds: children.flatMap((c) => c.memberIds),
    };
  }),
  ...categories(undefined, false),
];
const palettes: Record<Exclude<BrainPalette, "custom">, readonly string[]> = {
  classical: [
    "#c28b7b",
    "#d5b76d",
    "#7ea9bd",
    "#ac92b8",
    "#83b296",
    "#ce9c79",
    "#afa0c7",
    "#c6c5b5",
    "#83aaa8",
    "#b79d7d",
    "#b5a081",
  ],
  contrast: [
    "#f2a28d",
    "#f4d779",
    "#7cc9ed",
    "#dbb3ee",
    "#97e0b5",
    "#ffc591",
    "#d6c1ff",
    "#e8e7db",
    "#8fdbd7",
    "#e4b788",
    "#e8d3ac",
  ],
  accessible: [
    "#e69f00",
    "#56b4e9",
    "#009e73",
    "#f0e442",
    "#0072b2",
    "#d55e00",
    "#cc79a7",
    "#c6c5b5",
    "#56b4e9",
    "#e69f00",
    "#009e73",
  ],
};
export function brainRegionColor(
  id: string,
  palette: BrainPalette,
  styles: Readonly<Record<string, BrainStyle>>,
): string | undefined {
  const region = brainRegionById.get(id);
  if (!region) return undefined;
  if (palette === "custom") return styles[id]?.color;
  return (
    styles[id]?.color ??
    palettes[palette][
      BRAIN_CATEGORIES.findIndex((g) => g.id === region.category)
    ]
  );
}
export const BRAIN_ATLASES = [
  {
    id: "desikan-killiany",
    name: "Desikan–Killiany",
    version: "aparc / classifier 2010-03-25",
    space: "FreeSurfer subject surface / fsaverage",
    format: "FreeSurfer .annot + matching surfaces",
    sourceUrl: "https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation",
    licenseUrl:
      "https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense",
    kind: "anatomical",
  },
  {
    id: "destrieux",
    name: "Destrieux",
    version: "a2009s / 2009-07-29",
    space: "FreeSurfer subject surface / fsaverage",
    format: "FreeSurfer .annot + matching surfaces",
    sourceUrl: "https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation",
    licenseUrl:
      "https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense",
    kind: "anatomical",
  },
  {
    id: "hcp-mmp-1",
    name: "HCP-MMP1.0",
    version: "1.0 / Glasser 2016",
    space: "HCP fs_LR surface (exact mesh required)",
    format: "CIFTI labels + matched GIFTI surfaces / registration",
    sourceUrl: "https://balsa.wustl.edu/study/show/RVVG",
    licenseUrl: "https://balsa.wustl.edu/study/show/RVVG",
    kind: "multimodal",
  },
  ...([7, 17] as const).map((n) => ({
    id: `yeo-${n}`,
    name: `Yeo ${n}`,
    version: "2011 / N1000",
    space: "fsaverage surface or nonlinear MNI152 volume (not interchangeable)",
    format: ".annot with matched surface OR volume + template",
    sourceUrl:
      "https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation_Yeo2011",
    licenseUrl:
      "https://surfer.nmr.mgh.harvard.edu/fswiki/FreeSurferSoftwareLicense",
    kind: "functional-network",
  })),
].map((a) => ({
  ...a,
  integrated: false as const,
  correspondence: null,
  licenseStatus: "exact-file-review-required" as const,
}));
export const BRAIN_UNMAPPED = [
  "Superior temporal gyrus",
  "Precuneus",
  "Pars opercularis / triangularis / orbitalis",
  "Frontal / temporal poles",
  "Cuneus / lingual / calcarine subdivisions",
  "Anterior / posterior cingulate subdivisions",
  "Cerebellar hemispheres / vermis / lobules / nuclei",
  "Accumbens / subthalamic nucleus / substantia nigra",
  "Ventricular surfaces",
  "DK / Destrieux / HCP / Yeo parcel labels",
];
