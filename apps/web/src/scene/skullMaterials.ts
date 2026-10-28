import {
  Box3,
  BufferGeometry,
  MeshStandardMaterial,
  Sphere,
  Vector3,
} from "three";
import { SKELETON_ASSET, SKULL_BONE_MAPPINGS } from "@anatomy/data";
import layout from "../../../../packages/anatomy-data/src/skull-color-ranges.json";
import { skullDisplayColor } from "./skullBoneColors";

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

export function createSkullBoneMaterials(conceptId: string) {
  const base = new MeshStandardMaterial({
    color: skullDisplayColor(conceptId),
    roughness: 0.7,
    metalness: 0,
  });
  const hovered = base.clone();
  hovered.color.copy(skullDisplayColor(conceptId, true));
  const selected = hovered.clone();
  // Persistent selection retains the bone's own hue, never the global teal.
  selected.emissive.copy(base.color);
  selected.emissiveIntensity = 0.06;
  return { base, hovered, selected };
}
