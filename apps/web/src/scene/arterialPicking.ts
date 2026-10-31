import { Mesh } from "three";
const diagnostic =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("diagnostics");
const samples: number[] = [],
  stats = { calls: 0, totalMs: 0, maxMs: 0 };
const measured: Mesh["raycast"] = function (this: Mesh, raycaster, hits) {
  const start = performance.now();
  Mesh.prototype.raycast.call(this, raycaster, hits);
  const ms = performance.now() - start;
  stats.calls++;
  stats.totalMs += ms;
  stats.maxMs = Math.max(stats.maxMs, ms);
  samples.push(ms);
  if (samples.length > 256) samples.shift();
};
export const arterialRaycast = diagnostic ? measured : Mesh.prototype.raycast;
export const arterialPickingStatistics = () => ({
  ...stats,
  p95Ms:
    [...samples].sort((a, b) => a - b)[Math.floor(samples.length * 0.95)] ?? 0,
});
