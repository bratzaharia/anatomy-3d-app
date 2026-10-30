import { it, expect } from "vitest";
import {
  Mesh,
  BoxGeometry,
  MeshBasicMaterial,
  Plane,
  Vector3,
  Raycaster,
  type Intersection,
} from "three";
import { cardiacRaycast } from "./cardiacPicking";
it("cardiac picking excludes clipped and hidden source surfaces", () => {
  const geometry = new BoxGeometry(),
    material = new MeshBasicMaterial(),
    mesh = new Mesh(geometry, material),
    ray = new Raycaster(new Vector3(0, 0, 2), new Vector3(0, 0, -1));
  mesh.updateMatrixWorld();
  const hits: Intersection[] = [];
  cardiacRaycast.call(mesh, ray, hits);
  expect(hits.length).toBeGreaterThan(0);
  material.clippingPlanes = [new Plane(new Vector3(1, 0, 0), -1)];
  hits.length = 0;
  cardiacRaycast.call(mesh, ray, hits);
  expect(hits).toEqual([]);
  material.clippingPlanes = [];
  mesh.visible = false;
  cardiacRaycast.call(mesh, ray, hits);
  expect(hits).toEqual([]);
  geometry.dispose();
  material.dispose();
});
