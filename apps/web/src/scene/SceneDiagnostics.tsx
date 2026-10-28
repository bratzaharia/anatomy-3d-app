import { useEffect } from "react";
import { addAfterEffect, useThree } from "@react-three/fiber";
import { musclePickingStatistics } from "./musclePicking";

// Explicit opt-in test instrumentation; no frame requests, React updates, or
// production telemetry. The attribute is local to the existing canvas.
export function SceneDiagnostics() {
  const { gl, camera } = useThree();
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("diagnostics")) return;
    let frames = 0;
    let previous = performance.now();
    return addAfterEffect(() => {
      const now = performance.now();
      gl.domElement.dataset.anatomyMetrics = JSON.stringify({
        frames: ++frames,
        frameIntervalMs: now - previous,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        camera: camera.position.toArray(),
        dpr: gl.getPixelRatio(),
        musclePicking: musclePickingStatistics(),
      });
      previous = now;
    });
  }, [gl, camera]);
  return null;
}
