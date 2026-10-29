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
import { resolveNervousStructureIds } from "@anatomy/core";
import {
  NERVOUS_ASSET,
  NERVOUS_STRUCTURES,
  nervousMetadataById,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { nervousRaycast } from "./nervousPicking";

export const nervousAssetUrl = `${import.meta.env.VITE_NERVOUS_ASSET_BASE_URL ?? ""}${NERVOUS_ASSET.uri}`;
const noRaycast: Mesh["raycast"] = () => undefined;
type Materials = {
  cns: MeshStandardMaterial;
  pns: MeshStandardMaterial;
  selected: MeshStandardMaterial;
  hovered: MeshStandardMaterial;
};
const Nerve = memo(function Nerve({
  id,
  geometry,
  visible,
  materials,
}: {
  id: string;
  geometry: BufferGeometry;
  visible: boolean;
  materials: Materials;
}) {
  const selected = useViewerStore(
    (state) =>
      state.selectedId === id ||
      (state.selectedId === "nervous-brain" &&
        nervousMetadataById.get(id)?.parentId === "nervous-brain"),
  );
  const hovered = useViewerStore((state) => state.hoveredId === id);
  return (
    <mesh
      name={id}
      geometry={geometry}
      visible={visible}
      userData={{ anatomyId: id, systemId: "nervous" }}
      material={
        selected
          ? materials.selected
          : hovered
            ? materials.hovered
            : nervousMetadataById.get(id)?.division === "cns"
              ? materials.cns
              : materials.pns
      }
      raycast={visible ? nervousRaycast : noRaycast}
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
function NervousModel() {
  const { scene } = useGLTF(nervousAssetUrl);
  const invalidate = useThree((state) => state.invalidate);
  const systems = useViewerStore((state) => state.activeSystemIds);
  const hiddenIds = useViewerStore((state) => state.hiddenIds);
  const isolatedIds = useViewerStore((state) => state.isolatedIds);
  const divisions = useViewerStore((state) => state.nervousDivisions);
  const functions = useViewerStore((state) => state.nervousFunctions);
  const regions = useViewerStore((state) => state.nervousRegions);
  const visible = useMemo(
    () =>
      resolveNervousStructureIds(
        NERVOUS_STRUCTURES,
        systems,
        { hiddenIds, isolatedIds },
        { divisions, functions, regions },
      ),
    [systems, hiddenIds, isolatedIds, divisions, functions, regions],
  );
  const geometries = useMemo(() => {
    const result = new Map<string, BufferGeometry>();
    scene.traverse((object) => {
      if (
        object instanceof Mesh &&
        typeof object.userData.anatomyId === "string"
      ) {
        const id = object.userData.anatomyId;
        if (result.has(id)) throw new Error("Duplicate nervous mapping: " + id);
        result.set(id, object.geometry);
      }
    });
    if (
      result.size !== NERVOUS_ASSET.structures.length ||
      NERVOUS_ASSET.structures.some((item) => !result.has(item.id))
    )
      throw new Error("Incomplete nervous mapping");
    return result;
  }, [scene]);
  const materials = useMemo<Materials>(
    () => ({
      cns: new MeshStandardMaterial({
        color: "#b99e98",
        roughness: 0.76,
        metalness: 0,
      }),
      pns: new MeshStandardMaterial({
        color: "#bdae70",
        roughness: 0.78,
        metalness: 0,
      }),
      selected: new MeshStandardMaterial({
        color: "#70d9cf",
        roughness: 0.7,
        metalness: 0,
      }),
      hovered: new MeshStandardMaterial({
        color: "#eadca9",
        roughness: 0.72,
        metalness: 0,
      }),
    }),
    [],
  );
  useEffect(() => {
    useViewerStore.setState({ nervousStatus: "ready" });
    invalidate();
    return () =>
      Object.values(materials).forEach((material) => material.dispose());
  }, [materials, invalidate]);
  useEffect(() => {
    const id = useViewerStore.getState().hoveredId;
    if (id?.startsWith("nervous-") && !visible.has(id))
      useViewerStore.getState().hover(null);
    invalidate();
  }, [visible, invalidate]);
  // Loader-owned buffers stay cached; only locally owned materials are disposed.
  return (
    <group name="nervous-layer" dispose={null}>
      {[...geometries].map(([id, geometry]) => (
        <Nerve
          key={id}
          id={id}
          geometry={geometry}
          visible={visible.has(id)}
          materials={materials}
        />
      ))}
    </group>
  );
}
class NervousBoundary extends Component<
  { children: ReactNode; retry: number },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    useViewerStore.setState({ nervousStatus: "error" });
  }
  componentDidUpdate(previous: { retry: number }) {
    if (previous.retry !== this.props.retry) {
      useGLTF.clear(nervousAssetUrl);
      this.setState({ failed: false });
    }
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function NervousLayer() {
  const requested = useViewerStore((state) => state.nervousRequested);
  const retry = useViewerStore((state) => state.nervousRetry);
  return requested ? (
    <NervousBoundary retry={retry}>
      <Suspense fallback={null}>
        <NervousModel />
      </Suspense>
    </NervousBoundary>
  ) : null;
}
