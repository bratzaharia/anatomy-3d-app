import { Color, type MeshStandardMaterial } from "three";
export function brainMaterial(
  base: MeshStandardMaterial,
  color: string | undefined,
  opacity: number,
  selected: boolean,
  hovered: boolean,
) {
  if (!color && opacity === 1 && !selected && !hovered) return base;
  const material = base.clone();
  if (color) material.color.set(color);
  if (selected) material.color.lerp(new Color("#70d9cf"), 0.3);
  if (hovered) material.color.multiplyScalar(0.76);
  material.opacity = opacity;
  material.transparent = opacity < 1;
  material.depthWrite = opacity === 1;
  return material;
}
