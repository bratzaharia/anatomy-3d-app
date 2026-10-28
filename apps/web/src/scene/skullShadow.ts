import {
  Box3,
  OrthographicCamera,
  Vector3,
  type WebGLRenderer,
  type BufferGeometry,
} from "three";
import { SKELETON_ASSET } from "@anatomy/data";

// Preserve the original global key light's position, target, intensity and color.
export const SKULL_KEY_POSITION = [2, 3, 4] as const;
export const SKULL_SHADOW_SIZE = 1024;
const skullBounds = SKELETON_ASSET.structures.filter(
  (item) => item.id === "skull" || item.id === "mandible",
);

export function skullShadowFrustum() {
  const camera = new OrthographicCamera();
  camera.position.set(...SKULL_KEY_POSITION);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const lightBounds = new Box3();
  for (const bone of skullBounds)
    for (const x of [bone.bounds.min[0]!, bone.bounds.max[0]!])
      for (const y of [bone.bounds.min[1]!, bone.bounds.max[1]!])
        for (const z of [bone.bounds.min[2]!, bone.bounds.max[2]!])
          lightBounds.expandByPoint(
            new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse),
          );
  const margin = 0.025;
  return {
    left: lightBounds.min.x - margin,
    right: lightBounds.max.x + margin,
    bottom: lightBounds.min.y - margin,
    top: lightBounds.max.y + margin,
    near: Math.max(0.01, -lightBounds.max.z - margin),
    far: -lightBounds.min.z + margin,
  };
}
export const SKULL_SHADOW_FRUSTUM = skullShadowFrustum();

// Same opt-in local diagnostics model as the existing muscle-picking counters.
export const skullShadowStatistics = {
  draws: 0,
  triangles: 0,
  frameDraws: 0,
  frameTriangles: 0,
};
export function resetSkullShadowFrame(): void {
  skullShadowStatistics.frameDraws = 0;
  skullShadowStatistics.frameTriangles = 0;
}
// Imperative renderer boundary: refresh only after caster visibility/mode changes.
export function requestSkullShadowUpdate(renderer: WebGLRenderer): void {
  renderer.shadowMap.needsUpdate = true;
}
export function recordSkullShadowDraw(
  _renderer: unknown,
  _scene: unknown,
  _camera: unknown,
  _shadowCamera: unknown,
  geometry: BufferGeometry,
): void {
  const available =
    geometry.index?.count ?? geometry.getAttribute("position").count;
  const triangles =
    Math.max(
      0,
      Math.min(geometry.drawRange.count, available - geometry.drawRange.start),
    ) / 3;
  skullShadowStatistics.draws++;
  skullShadowStatistics.triangles += triangles;
  skullShadowStatistics.frameDraws++;
  skullShadowStatistics.frameTriangles += triangles;
}
