import { BufferGeometry } from "three";
import { SKELETAL_PART_PARENTS } from "@anatomy/data";
export type SkeletalPartition = (typeof SKELETAL_PART_PARENTS)[number];
export function skeletalPartAtFace(
  partition: SkeletalPartition,
  faceIndex: number | null | undefined,
): string | null {
  if (faceIndex == null || !Number.isInteger(faceIndex) || faceIndex < 0)
    return null;
  const offset = faceIndex * 3;
  return (
    partition.parts.find(
      (p) => offset >= p.indexStart && offset < p.indexStart + p.indexCount,
    )?.id ?? null
  );
}
// Coalesce adjacent equal materials: all unmodified bones in a parent still use
// one draw, while hidden ranges are absent from both rendering and raycasting.
export function skeletalDrawGroups(
  partition: SkeletalPartition,
  visible: ReadonlySet<string>,
  selected: string | null,
  hovered: string | null,
) {
  const groups: { start: number; count: number; materialIndex: number }[] = [];
  for (const part of partition.parts) {
    if (!visible.has(part.id)) continue;
    const materialIndex =
      selected === part.id || selected === partition.id
        ? 1
        : hovered === part.id || hovered === partition.id
          ? 2
          : 0;
    const prior = groups.at(-1);
    if (
      prior &&
      prior.materialIndex === materialIndex &&
      prior.start + prior.count === part.indexStart
    )
      prior.count += part.indexCount;
    else
      groups.push({
        start: part.indexStart,
        count: part.indexCount,
        materialIndex,
      });
  }
  return groups;
}
export function skeletalGeometryView(
  original: BufferGeometry,
  partition: SkeletalPartition,
) {
  if (
    original.index?.count !== partition.indexCount ||
    original.getAttribute("position").count !== partition.vertexCount
  )
    throw Error("Skeletal partition differs from fixed asset");
  const geometry = new BufferGeometry();
  for (const [name, attribute] of Object.entries(original.attributes))
    geometry.setAttribute(name, attribute);
  geometry.setIndex(original.index);
  geometry.boundingBox = original.boundingBox?.clone() ?? null;
  geometry.boundingSphere = original.boundingSphere?.clone() ?? null;
  return geometry;
}
