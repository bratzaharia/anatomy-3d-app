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
import { resolveVenousStructureIds } from "@anatomy/core";
import {
  VENOUS_ASSETS,
  VENOUS_STRUCTURES,
  venousMetadataById,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
const noRaycast: Mesh["raycast"] = () => undefined;
type MaterialSet = Record<string, MeshStandardMaterial>;
const Vein = memo(function Vein({
  id,
  geometry,
  visible,
  materials,
}: {
  id: string;
  geometry: BufferGeometry;
  visible: boolean;
  materials: MaterialSet;
}) {
  const selected = useViewerStore(
    (s) => s.selectedId === id || s.venousSelectedIds.has(id),
  );
  const traced = useViewerStore((s) => s.venousTraceIds.has(id));
  const hovered = useViewerStore((s) => s.hoveredId === id);
  const metadata = venousMetadataById.get(id)!;
  return (
    <mesh
      name={id}
      geometry={geometry}
      visible={visible}
      dispose={null}
      userData={{ anatomyId: id, systemId: "venous" }}
      material={
        materials[
          hovered
            ? "hovered"
            : selected
              ? "selected"
              : traced
                ? "trace"
                : metadata.depth
        ]!
      }
      raycast={visible ? Mesh.prototype.raycast : noRaycast}
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
          .selectVein(id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        const state = useViewerStore.getState();
        state.selectVein(id);
        state.setCameraView("focus");
      }}
    />
  );
});
const urlFor = (asset: (typeof VENOUS_ASSETS)[number]) =>
  `${import.meta.env.VITE_VENOUS_ASSET_BASE_URL ?? ""}${asset.uri}`;
function RegionalModel({
  asset,
  visible,
}: {
  asset: (typeof VENOUS_ASSETS)[number];
  visible: ReadonlySet<string>;
}) {
  const { scene } = useGLTF(urlFor(asset));
  const invalidate = useThree((s) => s.invalidate);
  const mode = useViewerStore((s) => s.venousMode),
    opacity = useViewerStore((s) => s.venousOpacity);
  const geometries = useMemo(() => {
    const result = new Map<string, BufferGeometry>();
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        const id = object.userData.anatomyId;
        if (
          typeof id !== "string" ||
          result.has(id) ||
          !asset.structureIds.includes(id)
        )
          throw Error("Invalid venous identity");
        result.set(id, object.geometry);
      }
    });
    if (result.size !== asset.structureIds.length)
      throw Error("Incomplete venous mapping");
    return result;
  }, [scene, asset]);
  const materials = useMemo(() => {
    const base =
      mode === "standard"
        ? "#74627b"
        : mode === "contrast"
          ? "#8dc7ff"
          : "#356dc0";
    return Object.fromEntries(
      Object.entries({
        superficial: mode === "depth" ? "#59b9d3" : base,
        deep: mode === "depth" ? "#6960ba" : base,
        perforating: mode === "depth" ? "#dc9c58" : base,
        unknown: mode === "depth" ? "#9aa1ac" : base,
        selected: "#77e0d5",
        hovered: "#c7f2ff",
        trace: "#edc873",
      }).map(([key, color]) => [
        key,
        new MeshStandardMaterial({
          color,
          roughness: 0.7,
          metalness: 0,
          opacity,
          transparent: opacity < 1,
          depthWrite: opacity === 1,
        }),
      ]),
    );
  }, [mode, opacity]);
  useEffect(() => {
    useViewerStore.getState().setVenousAssetStatus(asset.id, "ready");
    invalidate();
  }, [asset.id, geometries, invalidate]);
  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials],
  );
  useEffect(() => {
    const id = useViewerStore.getState().hoveredId;
    if (id?.startsWith("venous-") && (!visible.has(id) || opacity === 0))
      useViewerStore.getState().hover(null);
    invalidate();
  }, [visible, opacity, invalidate]);
  return (
    <group name={asset.id} dispose={null}>
      {[...geometries].map(([id, geometry]) => (
        <Vein
          key={id}
          id={id}
          geometry={geometry}
          visible={visible.has(id) && opacity > 0}
          materials={materials}
        />
      ))}
    </group>
  );
}
class RegionalBoundary extends Component<
  { asset: (typeof VENOUS_ASSETS)[number]; retry: number; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    useViewerStore
      .getState()
      .setVenousAssetStatus(this.props.asset.id, "error");
  }
  componentDidMount() {
    useViewerStore
      .getState()
      .setVenousAssetStatus(this.props.asset.id, "loading");
  }
  componentDidUpdate(previous: { retry: number }) {
    if (previous.retry !== this.props.retry && this.state.failed) {
      useGLTF.clear(urlFor(this.props.asset));
      this.setState({ failed: false });
      useViewerStore
        .getState()
        .setVenousAssetStatus(this.props.asset.id, "loading");
    }
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function VenousLayer() {
  const requested = useViewerStore((s) => s.venousRequested),
    retry = useViewerStore((s) => s.venousRetry);
  const systems = useViewerStore((s) => s.activeSystemIds),
    hiddenIds = useViewerStore((s) => s.hiddenIds),
    isolatedIds = useViewerStore((s) => s.isolatedIds);
  const groups = useViewerStore((s) => s.venousGroups),
    depths = useViewerStore((s) => s.venousDepths),
    regions = useViewerStore((s) => s.venousRegions);
  const visible = useMemo(
    () =>
      resolveVenousStructureIds(
        VENOUS_STRUCTURES,
        systems,
        { hiddenIds, isolatedIds },
        { groups, depths, regions },
      ),
    [systems, hiddenIds, isolatedIds, groups, depths, regions],
  );
  // No venous request on initial load. Each region suspends independently;
  // excluded regions do not request a GLB. useGLTF owns cached geometry.
  return requested
    ? VENOUS_ASSETS.filter((asset) =>
        asset.structureIds.some((id) => visible.has(id)),
      ).map((asset) => (
        <RegionalBoundary key={asset.id} asset={asset} retry={retry}>
          <Suspense fallback={null}>
            <RegionalModel asset={asset} visible={visible} />
          </Suspense>
        </RegionalBoundary>
      ))
    : null;
}
