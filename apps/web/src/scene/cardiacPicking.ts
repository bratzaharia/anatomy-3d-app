import { Mesh, type Intersection, type Raycaster, type Plane } from "three";
export function cardiacRaycast(
  this: Mesh,
  raycaster: Raycaster,
  hits: Intersection[],
) {
  if (!this.visible) return;
  const found: Intersection[] = [];
  Mesh.prototype.raycast.call(this, raycaster, found);
  const material = Array.isArray(this.material)
    ? this.material[0]
    : this.material;
  const planes: readonly Plane[] = material?.clippingPlanes ?? [];
  for (const hit of found)
    if (planes.every((p) => p.distanceToPoint(hit.point) >= 0)) hits.push(hit);
}
