import { memo, useEffect, useMemo } from "react";
import type { BufferGeometry, MeshStandardMaterial } from "three";
import { brainRegionColor } from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { nervousRaycast } from "./nervousPicking";
import { brainMaterial } from "./brainMaterials";
const noRaycast = () => undefined;
export const BrainRegion = memo(function BrainRegion({
  id,
  geometry,
  visible,
  base,
}: {
  id: string;
  geometry: BufferGeometry;
  visible: boolean;
  base: MeshStandardMaterial;
}) {
  const selected = useViewerStore((s) => s.brainSelectedIds.has(id));
  const hovered = useViewerStore((s) => s.hoveredId === id);
  // Only the source-regions mode may color source parts. An unavailable atlas
  // never falls through to anatomical colors and never requests parcel data.
  const color = useViewerStore((s) =>
    s.brainMode === "regions"
      ? brainRegionColor(id, s.brainPalette, s.brainStyles)
      : undefined,
  );
  const opacity = useViewerStore(
    (s) => s.brainOpacity * (s.brainStyles[id]?.opacity ?? 1),
  );
  const material = useMemo(
    () => brainMaterial(base, color, opacity, selected, hovered),
    [base, color, opacity, selected, hovered],
  );
  useEffect(
    () => () => {
      if (material !== base) material.dispose();
    },
    [material, base],
  );
  useEffect(() => {
    if (
      (!visible || opacity === 0) &&
      useViewerStore.getState().hoveredId === id
    )
      useViewerStore.getState().hover(null);
  }, [id, visible, opacity]);
  return (
    <mesh
      name={id}
      geometry={geometry}
      material={material}
      visible={visible && opacity > 0}
      dispose={null}
      userData={{ anatomyId: id, systemId: "nervous", brainRegion: true }}
      raycast={visible && opacity > 0 ? nervousRaycast : noRaycast}
      onPointerOver={(e) => {
        e.stopPropagation();
        useViewerStore.getState().hover(id);
      }}
      onPointerOut={() => {
        if (useViewerStore.getState().hoveredId === id)
          useViewerStore.getState().hover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        useViewerStore
          .getState()
          .selectBrain(id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        const s = useViewerStore.getState();
        s.selectBrain(id);
        s.setCameraView("focus");
      }}
    />
  );
});
