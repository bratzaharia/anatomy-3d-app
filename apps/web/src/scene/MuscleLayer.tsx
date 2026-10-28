import {
  Component,
  memo,
  Suspense,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, type BufferGeometry } from "three";
import { MUSCLE_ASSET, MUSCLE_STRUCTURES } from "@anatomy/data";
import { resolveVisibleStructureIds } from "@anatomy/core";
import { useViewerStore } from "../store/viewerStore";
import { muscleAssetUrl } from "./muscleAsset";
import { muscleRaycast } from "./musclePicking";
import { MuscleQuality } from "./MuscleQuality";

const noRaycast: Mesh["raycast"] = () => undefined;
type Materials = Record<"base" | "selected" | "hovered", MeshStandardMaterial>;
const Muscle = memo(function Muscle({
  id,
  geometry,
  visible,
  pickable,
  materials,
}: {
  readonly id: string;
  readonly geometry: BufferGeometry;
  readonly visible: boolean;
  readonly pickable: boolean;
  readonly materials: Materials;
}) {
  const selected = useViewerStore((state) => state.selectedId === id);
  const hovered = useViewerStore((state) => state.hoveredId === id);
  return (
    <mesh
      name={id}
      geometry={geometry}
      visible={visible}
      userData={{ anatomyId: id, systemId: "muscular" }}
      material={
        selected
          ? materials.selected
          : hovered
            ? materials.hovered
            : materials.base
      }
      raycast={pickable ? muscleRaycast : noRaycast}
      onPointerOver={(event) => {
        event.stopPropagation();
        useViewerStore.getState().hover(id);
      }}
      onPointerOut={() => {
        if (useViewerStore.getState().hoveredId === id)
          useViewerStore.getState().hover(null);
      }}
      onClick={(event) => {
        event.stopPropagation();
        useViewerStore.getState().select(id);
      }}
    />
  );
});

function MuscleModel() {
  const { scene } = useGLTF(muscleAssetUrl);
  const invalidate = useThree((state) => state.invalidate);
  const systems = useViewerStore((state) => state.activeSystemIds);
  const hiddenIds = useViewerStore((state) => state.hiddenIds);
  const isolatedIds = useViewerStore((state) => state.isolatedIds);
  const opacity = useViewerStore((state) => state.muscleOpacity);
  const visible = useMemo(
    () =>
      resolveVisibleStructureIds(MUSCLE_STRUCTURES, systems, {
        hiddenIds,
        isolatedIds,
      }),
    [systems, hiddenIds, isolatedIds],
  );
  const geometries = useMemo(() => {
    const result = new Map<string, BufferGeometry>();
    scene.traverse((object) => {
      if (
        object instanceof Mesh &&
        typeof object.userData.anatomyId === "string"
      ) {
        const id = object.userData.anatomyId;
        if (result.has(id))
          throw new Error("Duplicate muscular mapping: " + id);
        result.set(id, object.geometry);
      }
    });
    if (
      result.size !== MUSCLE_ASSET.structures.length ||
      MUSCLE_ASSET.structures.some((item) => !result.has(item.id))
    )
      throw new Error("Incomplete muscular mapping");
    return result;
  }, [scene]);
  const materials = useMemo<Materials>(
    () => ({
      base: new MeshStandardMaterial({
        color: "#a4444c",
        roughness: 0.78,
        metalness: 0,
      }),
      selected: new MeshStandardMaterial({
        color: "#72d8cc",
        roughness: 0.65,
        emissive: "#235f56",
        emissiveIntensity: 0.2,
      }),
      hovered: new MeshStandardMaterial({
        color: "#eaa0a0",
        roughness: 0.72,
        emissive: "#742f34",
        emissiveIntensity: 0.1,
      }),
    }),
    [],
  );
  useEffect(() => {
    useViewerStore.setState({ muscleStatus: "ready" });
    invalidate();
    return () =>
      Object.values(materials).forEach((material) => material.dispose());
  }, [materials, invalidate]);
  useEffect(() => {
    for (const material of Object.values(materials)) {
      const transparent = opacity < 1;
      if (material.transparent !== transparent) {
        material.transparent = transparent;
        material.needsUpdate = true;
      }
      material.opacity = opacity;
      material.depthWrite = !transparent;
    }
    invalidate();
  }, [opacity, materials, invalidate]);
  useEffect(() => {
    const id = useViewerStore.getState().hoveredId;
    if (id?.startsWith("muscle-") && (!visible.has(id) || opacity === 0))
      useViewerStore.getState().hover(null);
    invalidate();
  }, [visible, opacity, invalidate]);
  return (
    <group name="muscular-layer" dispose={null}>
      {[...geometries].map(([id, geometry]) => (
        <Muscle
          key={id}
          id={id}
          geometry={geometry}
          visible={visible.has(id) && opacity > 0}
          pickable={visible.has(id) && opacity > 0}
          materials={materials}
        />
      ))}
    </group>
  );
}
class MuscleBoundary extends Component<
  { children: ReactNode; retry: number },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    useViewerStore.setState({ muscleStatus: "error" });
  }
  componentDidUpdate(previous: { retry: number }) {
    if (previous.retry !== this.props.retry) {
      useGLTF.clear(muscleAssetUrl);
      this.setState({ failed: false });
    }
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function MuscleLayer() {
  const requested = useViewerStore((state) => state.muscleRequested);
  const retry = useViewerStore((state) => state.muscleRetry);
  // Mount once on first enable, then retain the decoded cache and stable meshes.
  return requested ? (
    <>
      <MuscleQuality />
      <MuscleBoundary retry={retry}>
        <Suspense fallback={null}>
          <MuscleModel />
        </Suspense>
      </MuscleBoundary>
    </>
  ) : null;
}
