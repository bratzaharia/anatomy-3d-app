import {
  Box3,
  BufferGeometry,
  MeshStandardMaterial,
  Sphere,
  Vector3,
} from "three";
import {
  SKELETON_ASSET,
  SKULL_BONE_MAPPINGS,
  SKULL_VISUALIZATION_MODES,
  type SkullAppearance,
  type SkullViewMode,
} from "@anatomy/data";
import layout from "../../../../packages/anatomy-data/src/skull-color-ranges.json";
import { skullDisplayColor } from "./skullBoneColors";
import { configureSkullSurface, SKULL_SURFACE } from "./skullSurface";

export function validateSkullColorLayout(geometry: BufferGeometry): void {
  if (
    layout.assetSha256 !== SKELETON_ASSET.sha256 ||
    geometry.getAttribute("position").count !== layout.vertexCount ||
    geometry.index?.count !== layout.indexCount
  )
    throw new Error("Skull material boundaries do not match the audited asset");
}

// Lightweight draw-range views share all original position/normal/index buffers.
// No vertices, triangles, normals, transforms or original GLTF objects are edited.
export function createSkullGeometryViews(original: BufferGeometry) {
  validateSkullColorLayout(original);
  return SKULL_BONE_MAPPINGS.map((range) => {
    const geometry = new BufferGeometry();
    for (const [name, attribute] of Object.entries(original.attributes))
      geometry.setAttribute(name, attribute);
    geometry.setIndex(original.index);
    geometry.setDrawRange(range.indexStart, range.indexCount);
    geometry.boundingBox = new Box3(
      new Vector3(...range.bounds.min),
      new Vector3(...range.bounds.max),
    );
    geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(
      new Sphere(),
    );
    return { id: range.id, geometry };
  });
}

export function createSkullBoneMaterials(
  conceptId: string,
  appearance: SkullAppearance = "anatomical",
) {
  const base = new MeshStandardMaterial({
    color:
      appearance === "anatomical"
        ? skullDisplayColor(conceptId)
        : appearance === "neutral"
          ? "#c7c3ba"
          : "#b7d7e7",
    roughness:
      appearance === "radiographic"
        ? 0.7
        : appearance === "neutral"
          ? 0.54
          : 0.62,
    metalness: 0,
  });
  if (appearance === "radiographic") {
    base.transparent = true;
    base.opacity = 0.28;
    base.depthWrite = false;
    base.emissive.set("#6d9ab3");
    base.emissiveIntensity = 0.35;
  }
  const selected = base.clone();
  if (appearance === "anatomical")
    selected.color.copy(skullDisplayColor(conceptId, true));
  else
    selected.color
      .convertLinearToSRGB()
      .multiplyScalar(0.8)
      .convertSRGBToLinear();
  // Persistent selection retains the bone's own hue, never the global teal.
  selected.emissive.copy(base.color);
  selected.emissiveIntensity = 0.06;
  if (appearance === "radiographic") {
    selected.opacity = 0.44;
    selected.emissiveIntensity = 0.4;
  }
  const states = {
    base,
    selected,
    hovered: base.clone(),
    selectedHovered: selected.clone(),
  };
  for (const [state, material] of Object.entries(states))
    configureSkullSurface(
      material,
      appearance !== "radiographic",
      state === "hovered" || state === "selectedHovered",
    );
  return states;
}

export function createSkullVisualizationMaterials() {
  const concepts = [
    ...SKULL_BONE_MAPPINGS,
    { id: "mandible", conceptId: "FMA52748" },
  ];
  const owned = new Set<ReturnType<typeof createSkullBoneMaterials>>();
  const modes = {} as Record<
    SkullViewMode,
    ReadonlyMap<string, BoneMaterialSet>
  >;
  for (const mode of SKULL_VISUALIZATION_MODES) {
    const shared =
      mode.appearance === "anatomical"
        ? null
        : createSkullBoneMaterials("FMA52748", mode.appearance);
    if (shared) owned.add(shared);
    modes[mode.id] = new Map(
      concepts.map((concept) => {
        const materials =
          shared ??
          createSkullBoneMaterials(concept.conceptId, mode.appearance);
        owned.add(materials);
        return [concept.id, materials] as const;
      }),
    );
  }
  return {
    modes,
    dispose: () =>
      owned.forEach((set) =>
        Object.values(set).forEach((material) => material.dispose()),
      ),
  };
}

export const SKULL_HOVER_BRIGHTNESS = SKULL_SURFACE.hoverBrightness;

export interface BoneMaterialSet {
  readonly base: MeshStandardMaterial;
  readonly selected: MeshStandardMaterial;
  readonly hovered: MeshStandardMaterial;
  readonly selectedHovered?: MeshStandardMaterial;
}

export function resolveBoneMaterial(
  materials: BoneMaterialSet,
  selected: boolean,
  hovered: boolean,
): MeshStandardMaterial {
  // Skull opts into a fourth state. Other bones retain their existing priority.
  if (hovered && materials.selectedHovered)
    return selected ? materials.selectedHovered : materials.hovered;
  return selected
    ? materials.selected
    : hovered
      ? materials.hovered
      : materials.base;
}
