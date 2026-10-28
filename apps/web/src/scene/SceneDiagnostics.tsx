import { useEffect } from "react";
import { addAfterEffect, useThree, useFrame } from "@react-three/fiber";
import { musclePickingStatistics } from "./musclePicking";
import { skullShadowStatistics, resetSkullShadowFrame } from "./skullShadow";

// Explicit opt-in test instrumentation; no frame requests, React updates, or
// production telemetry. The attribute is local to the existing canvas.
export function SceneDiagnostics() {
  const { gl, camera } = useThree();
  useFrame(() => resetSkullShadowFrame());
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("diagnostics")) return;
    let frames = 0;
    let previous = performance.now();
    return addAfterEffect(() => {
      const now = performance.now();
      gl.domElement.dataset.anatomyMetrics = JSON.stringify({
        frames: ++frames,
        frameIntervalMs: now - previous,
        // Preserve the main-pass geometry contract; also expose total submitted
        // work, including the new explicitly measured shadow-update pass.
        calls: gl.info.render.calls - skullShadowStatistics.frameDraws,
        triangles:
          gl.info.render.triangles - skullShadowStatistics.frameTriangles,
        totalCalls: gl.info.render.calls,
        totalTriangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        shadows: {
          enabled: gl.shadowMap.enabled,
          autoUpdate: gl.shadowMap.autoUpdate,
          draws: skullShadowStatistics.draws,
          triangles: skullShadowStatistics.triangles,
          frameDraws: skullShadowStatistics.frameDraws,
          frameTriangles: skullShadowStatistics.frameTriangles,
        },
        camera: camera.position.toArray(),
        projection: camera.type,
        programs: gl.info.programs?.length ?? 0,
        dpr: gl.getPixelRatio(),
        musclePicking: musclePickingStatistics(),
      });
      previous = now;
    });
  }, [gl, camera]);
  return null;
}
