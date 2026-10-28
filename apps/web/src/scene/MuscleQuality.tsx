import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useViewerStore } from "../store/viewerStore";

// Only resolution adapts; no anatomical geometry is simplified or replaced.
// Restore the exact previous DPR when muscles are disabled.
export function MuscleQuality() {
  const enabled = useViewerStore((state) =>
    state.activeSystemIds.has("muscular"),
  );
  const { gl, setDpr, invalidate } = useThree();
  useEffect(() => {
    if (!enabled) return;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    const constrained =
      window.matchMedia("(pointer: coarse)").matches ||
      (memory !== undefined && memory <= 4) ||
      (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency < 4);
    if (!constrained) return;
    const previous = gl.getPixelRatio();
    setDpr(Math.min(1, previous));
    invalidate();
    return () => {
      setDpr(previous);
      invalidate();
    };
  }, [enabled, gl, setDpr, invalidate]);
  return null;
}
