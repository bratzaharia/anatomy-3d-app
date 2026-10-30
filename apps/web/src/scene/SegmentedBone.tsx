import { memo, useEffect, useLayoutEffect, useMemo } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Mesh, type BufferGeometry, type MeshStandardMaterial } from "three";
import { useViewerStore } from "../store/viewerStore";
import {
  skeletalDrawGroups,
  skeletalGeometryView,
  skeletalPartAtFace,
  type SkeletalPartition,
} from "./skeletalParts";
const noRaycast: Mesh["raycast"] = () => undefined;
export const SegmentedBone = memo(function SegmentedBone({
  original,
  partition,
  visible,
  materials,
}: {
  readonly original: BufferGeometry;
  readonly partition: SkeletalPartition;
  readonly visible: ReadonlySet<string>;
  readonly materials: Record<
    "base" | "selected" | "hovered",
    MeshStandardMaterial
  >;
}) {
  const ownsId = useMemo(
    () => new Set([partition.id, ...partition.parts.map((p) => p.id)]),
    [partition],
  );
  const selected = useViewerStore((state) =>
    state.selectedId && ownsId.has(state.selectedId) ? state.selectedId : null,
  );
  const hovered = useViewerStore((state) =>
    state.hoveredId && ownsId.has(state.hoveredId) ? state.hoveredId : null,
  );
  const invalidate = useThree((state) => state.invalidate);
  const geometry = useMemo(
    () => skeletalGeometryView(original, partition),
    [original, partition],
  );
  const drawMaterials = useMemo(
    () => [materials.base, materials.selected, materials.hovered],
    [materials],
  );
  const groups = useMemo(
    () => skeletalDrawGroups(partition, visible, selected, hovered),
    [partition, visible, selected, hovered],
  );
  useLayoutEffect(() => {
    geometry.clearGroups();
    for (const g of groups)
      geometry.addGroup(g.start, g.count, g.materialIndex);
    invalidate();
  }, [geometry, groups, invalidate]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const pick = (event: ThreeEvent<PointerEvent | MouseEvent>) =>
    skeletalPartAtFace(partition, event.faceIndex);
  return (
    <mesh
      name={partition.id}
      geometry={geometry}
      material={drawMaterials}
      visible={groups.length > 0}
      raycast={groups.length ? Mesh.prototype.raycast : noRaycast}
      onPointerOver={(event) => {
        const id = pick(event);
        if (id) {
          event.stopPropagation();
          useViewerStore.getState().hover(id);
        }
      }}
      onPointerMove={(event) => {
        const id = pick(event);
        if (id) {
          event.stopPropagation();
          useViewerStore.getState().hover(id);
        }
      }}
      onPointerOut={() => {
        if (
          partition.parts.some(
            (p) => p.id === useViewerStore.getState().hoveredId,
          )
        )
          useViewerStore.getState().hover(null);
      }}
      onClick={(event) => {
        const id = pick(event);
        if (id) {
          event.stopPropagation();
          useViewerStore.getState().select(id);
        }
      }}
    />
  );
});
