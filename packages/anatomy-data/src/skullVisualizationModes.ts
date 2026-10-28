import type { LocalizedText } from "@anatomy/core";

export interface SkullVisualizationMode {
  readonly id: string;
  readonly category: "primary";
  readonly names: LocalizedText;
  readonly description: LocalizedText;
  readonly thumbnailId: string;
  readonly implemented: boolean;
  readonly appearance: "neutral" | "anatomical" | "radiographic";
}

// Primary modes are mutually exclusive. Future labels/suture overlays belong
// in a separate overlay registry/state, not extra active primary modes.
export const SKULL_VISUALIZATION_MODES = [
  {
    id: "simple",
    category: "primary",
    implemented: true,
    appearance: "neutral",
    names: { en: "Simple", ro: "Simplu" },
    description: { en: "Natural bone shading", ro: "Aspect osos natural" },
    thumbnailId: "simple",
  },
  {
    id: "colored",
    category: "primary",
    implemented: true,
    appearance: "anatomical",
    names: { en: "Colored", ro: "Colorat" },
    description: {
      en: "Anatomical bone-by-bone colors",
      ro: "Culori anatomice pe fiecare os",
    },
    thumbnailId: "colored",
  },
  {
    id: "xray",
    category: "primary",
    implemented: true,
    appearance: "radiographic",
    names: { en: "X-ray", ro: "Radiografie" },
    description: {
      en: "Translucent educational view",
      ro: "Vedere educațională translucidă",
    },
    thumbnailId: "xray",
  },
] as const satisfies readonly SkullVisualizationMode[];
export type SkullViewMode = (typeof SKULL_VISUALIZATION_MODES)[number]["id"];
export type SkullAppearance = SkullVisualizationMode["appearance"];
