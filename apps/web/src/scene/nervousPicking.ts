import { Mesh } from "three";
const diagnostic =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("diagnostics");
const statistics = { calls: 0, totalMs: 0, maxMs: 0 };
const measured: Mesh["raycast"] = function (
  this: Mesh,
  raycaster,
  intersections,
) {
  const start = performance.now();
  Mesh.prototype.raycast.call(this, raycaster, intersections);
  const elapsed = performance.now() - start;
  statistics.calls++;
  statistics.totalMs += elapsed;
  statistics.maxMs = Math.max(statistics.maxMs, elapsed);
};
export const nervousRaycast = diagnostic ? measured : Mesh.prototype.raycast;
export const nervousPickingStatistics = () => ({ ...statistics });
