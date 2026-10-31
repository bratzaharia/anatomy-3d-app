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
import {
  Mesh,
  MeshStandardMaterial,
  DoubleSide,
  type BufferGeometry,
} from "three";
import { resolveArterialStructureIds } from "@anatomy/core";
import {
  ARTERIAL_ASSETS,
  ARTERIAL_STRUCTURES,
  arterialMetadataById,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { arterialColor } from "./arterialMaterials";
import { arterialRaycast } from "./arterialPicking";
const noRaycast = () => undefined;
const Artery = memo(function Artery({
  id,
  geometry,
  visible,
}: {
  id: string;
  geometry: BufferGeometry;
  visible: boolean;
}) {
  const mode = useViewerStore((s) => s.arterialMode),
    opacity = useViewerStore((s) => s.arterialOpacity),
    color = useViewerStore((s) => s.arterialStyles[id]),
    selected = useViewerStore(
      (s) => s.arterialSelectedIds.has(id) || s.selectedId === id,
    ),
    hovered = useViewerStore((s) => s.hoveredId === id),
    traced = useViewerStore((s) => s.arterialTraceIds.has(id)),
    hasTrace = useViewerStore((s) => s.arterialTraceIds.size > 0);
  const material = useMemo(() => {
    const m = new MeshStandardMaterial({
      color: arterialColor(mode, arterialMetadataById.get(id)!.group, color),
      roughness: 0.72,
      metalness: 0,
      side: DoubleSide,
      opacity: hasTrace && !traced ? opacity * 0.18 : opacity,
      transparent: opacity < 1 || (hasTrace && !traced),
      depthWrite: opacity === 1 && (!hasTrace || traced),
    });
    if (hovered) m.color.multiplyScalar(0.7);
    if (selected || traced) {
      m.emissive.set(traced ? "#efbc79" : "#70d9cf");
      m.emissiveIntensity = 0.18;
    }
    return m;
  }, [id, mode, color, opacity, selected, hovered, traced, hasTrace]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh
      name={id}
      geometry={geometry}
      material={material}
      dispose={null}
      visible={visible && opacity > 0}
      userData={{ anatomyId: id, systemId: "arterial" }}
      raycast={visible && opacity > 0 ? arterialRaycast : noRaycast}
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
          .selectArtery(id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        const s = useViewerStore.getState();
        s.selectArtery(id);
        s.setCameraView("focus");
      }}
    />
  );
});
const assetUrl = (a: (typeof ARTERIAL_ASSETS)[number]) =>
  `${a.id.includes("heart-") ? (import.meta.env.VITE_CARDIAC_ASSET_BASE_URL ?? "") : (import.meta.env.VITE_ARTERIAL_ASSET_BASE_URL ?? "")}${a.uri}`;
function ArterialAsset({
  asset,
  visible,
}: {
  asset: (typeof ARTERIAL_ASSETS)[number];
  visible: ReadonlySet<string>;
}) {
  const { scene } = useGLTF(assetUrl(asset)),
    invalidate = useThree((s) => s.invalidate);
  const geometry = useMemo(() => {
    const result = new Map<string, BufferGeometry>();
    scene.traverse((o) => {
      if (o instanceof Mesh) {
        const id = o.userData.anatomyId;
        if (
          typeof id !== "string" ||
          !asset.structureIds.includes(id) ||
          result.has(id)
        )
          throw Error("Invalid arterial source identity");
        result.set(id, o.geometry);
      }
    });
    if (result.size !== asset.structureIds.length)
      throw Error("Incomplete arterial source mapping");
    return result;
  }, [scene, asset]);
  useEffect(() => {
    useViewerStore.getState().setArterialStatus(asset.id, "ready");
    invalidate();
  }, [asset.id, geometry, invalidate]);
  return (
    <group dispose={null}>
      {[...geometry].map(([id, g]) => (
        <Artery key={id} id={id} geometry={g} visible={visible.has(id)} />
      ))}
    </group>
  );
}
class ArterialBoundary extends Component<
  {
    asset: (typeof ARTERIAL_ASSETS)[number];
    retry: number;
    children: ReactNode;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidMount() {
    useViewerStore.getState().setArterialStatus(this.props.asset.id, "loading");
  }
  componentDidCatch() {
    useViewerStore.getState().setArterialStatus(this.props.asset.id, "error");
  }
  componentDidUpdate(old: { retry: number }) {
    if (this.state.failed && old.retry !== this.props.retry) {
      useGLTF.clear(assetUrl(this.props.asset));
      this.setState({ failed: false });
      useViewerStore
        .getState()
        .setArterialStatus(this.props.asset.id, "loading");
    }
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function ArterialSystemLayer() {
  const systems = useViewerStore((s) => s.activeSystemIds),
    groups = useViewerStore((s) => s.arterialGroups),
    levels = useViewerStore((s) => s.arterialLevels),
    sides = useViewerStore((s) => s.arterialSides),
    hiddenIds = useViewerStore((s) => s.hiddenIds),
    isolatedIds = useViewerStore((s) => s.isolatedIds),
    opacity = useViewerStore((s) => s.arterialOpacity),
    retry = useViewerStore((s) => s.arterialRetry),
    invalidate = useThree((s) => s.invalidate);
  const visible = useMemo(
    () =>
      resolveArterialStructureIds(
        ARTERIAL_STRUCTURES,
        systems,
        { hiddenIds, isolatedIds },
        { groups, levels, sides },
      ),
    [systems, groups, levels, sides, hiddenIds, isolatedIds],
  );
  useEffect(() => {
    const s = useViewerStore.getState();
    if (
      arterialMetadataById.has(s.hoveredId ?? "") &&
      (!visible.has(s.hoveredId!) || opacity === 0)
    )
      s.hover(null);
    invalidate();
  }, [visible, opacity, invalidate]);
  return systems.has("arterial") && opacity > 0
    ? ARTERIAL_ASSETS.filter((a) =>
        a.structureIds.some((id) => visible.has(id)),
      ).map((a) => (
        <ArterialBoundary key={a.id} asset={a} retry={retry}>
          <Suspense fallback={null}>
            <ArterialAsset asset={a} visible={visible} />
          </Suspense>
        </ArterialBoundary>
      ))
    : null;
}
