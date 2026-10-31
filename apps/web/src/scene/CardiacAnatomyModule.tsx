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
  Plane,
  Vector3,
  DoubleSide,
  type BufferGeometry,
} from "three";
import { resolveCardiacStructureIds } from "@anatomy/core";
import {
  CARDIAC_ASSETS,
  CARDIAC_STRUCTURES,
  CARDIAC_SELECTORS,
  cardiacMetadataById,
  CARDIAC_GEOMETRY,
} from "@anatomy/data";
import { useViewerStore } from "../store/viewerStore";
import { cardiacRaycast } from "./cardiacPicking";
const noRaycast = () => undefined;
const colorByGroup = {
  walls: "#b97079",
  cavities: "#73a2ca",
  valves: "#d8c6a7",
  papillary: "#aa5867",
  "coronary-arteries": "#cb7467",
  "great-arteries": "#d18b7d",
};
const CardiacPart = memo(function CardiacPart({
  id,
  geometry,
  visible,
}: {
  id: string;
  geometry: BufferGeometry;
  visible: boolean;
}) {
  const mode = useViewerStore((s) => s.cardiacMode),
    opacity = useViewerStore(
      (s) =>
        s.cardiacOpacity *
        (cardiacMetadataById.get(id)?.category === "wall"
          ? s.cardiacWallOpacity
          : 1),
    ),
    clip = useViewerStore((s) => s.cardiacClip),
    level = useViewerStore((s) => s.cardiacClipLevel),
    color = useViewerStore((s) => s.cardiacStyles[id]),
    selected = useViewerStore(
      (s) => s.cardiacSelectedIds.has(id) || s.selectedId === id,
    ),
    hovered = useViewerStore((s) => s.hoveredId === id);
  const source = cardiacMetadataById.get(id)!;
  const material = useMemo(() => {
    const m = new MeshStandardMaterial({
      color:
        mode === "natural"
          ? source.category === "valve"
            ? "#d2bca7"
            : source.category === "artery"
              ? "#a36970"
              : "#a4656d"
          : (color ?? colorByGroup[source.group]),
      roughness: 0.72,
      metalness: 0,
      opacity,
      transparent: opacity < 1,
      depthWrite: opacity === 1,
      side: DoubleSide,
    });
    if (hovered) m.color.multiplyScalar(0.7);
    if (selected) {
      m.emissive.set("#70d9cf");
      m.emissiveIntensity = 0.18;
    }
    if (clip) {
      const all = CARDIAC_GEOMETRY.filter((s) => s.category !== "artery"),
        min = Math.min(...all.map((s) => s.bounds.min[1])),
        max = Math.max(...all.map((s) => s.bounds.max[1]));
      m.clippingPlanes = [
        new Plane(new Vector3(0, -1, 0), min + (max - min) * level),
      ];
    }
    return m;
  }, [mode, source, color, opacity, clip, level, selected, hovered]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh
      name={id}
      geometry={geometry}
      material={material}
      dispose={null}
      visible={visible && opacity > 0}
      userData={{
        anatomyId: id,
        systemId: source.category === "artery" ? "arterial" : "cardiac",
      }}
      raycast={visible && opacity > 0 ? cardiacRaycast : noRaycast}
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
          .selectCardiac(id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        const s = useViewerStore.getState();
        s.selectCardiac(id);
        s.setCameraView("focus");
      }}
    />
  );
});
const url = (a: (typeof CARDIAC_ASSETS)[number]) =>
  `${import.meta.env.VITE_CARDIAC_ASSET_BASE_URL ?? ""}${a.uri}`;
function CardiacAsset({
  asset,
  visible,
}: {
  asset: (typeof CARDIAC_ASSETS)[number];
  visible: ReadonlySet<string>;
}) {
  const { scene } = useGLTF(url(asset));
  const invalidate = useThree((s) => s.invalidate);
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
          throw Error("Invalid cardiac source mapping");
        result.set(id, o.geometry);
      }
    });
    if (result.size !== asset.structureIds.length)
      throw Error("Incomplete cardiac source mapping");
    return result;
  }, [scene, asset]);
  useEffect(() => {
    useViewerStore.getState().setCardiacStatus(asset.id, "ready");
    invalidate();
  }, [asset.id, geometry, invalidate]);
  return (
    <group dispose={null}>
      {[...geometry].map(([id, g]) => (
        <CardiacPart key={id} id={id} geometry={g} visible={visible.has(id)} />
      ))}
    </group>
  );
}
class CardiacBoundary extends Component<
  {
    asset: (typeof CARDIAC_ASSETS)[number];
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
    useViewerStore.getState().setCardiacStatus(this.props.asset.id, "loading");
  }
  componentDidCatch() {
    useViewerStore.getState().setCardiacStatus(this.props.asset.id, "error");
  }
  componentDidUpdate(old: { retry: number }) {
    if (this.state.failed && old.retry !== this.props.retry) {
      useGLTF.clear(url(this.props.asset));
      this.setState({ failed: false });
      useViewerStore
        .getState()
        .setCardiacStatus(this.props.asset.id, "loading");
    }
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export function CardiacAnatomyModule() {
  // One render owner for the seven canonical shared arteries. When the whole
  // arterial layer is enabled its filters/styles own these exact same IDs.
  const arterial = useViewerStore((s) => s.activeSystemIds.has("arterial"));
  const enabled = useViewerStore((s) => s.cardiacEnabled),
    groups = useViewerStore((s) => s.cardiacGroups),
    hiddenIds = useViewerStore((s) => s.hiddenIds),
    isolatedIds = useViewerStore((s) => s.isolatedIds),
    retry = useViewerStore((s) => s.cardiacRetry),
    opacity = useViewerStore((s) => s.cardiacOpacity);
  const invalidate = useThree((s) => s.invalidate);
  const visible = useMemo(
    () =>
      new Set(
        [
          ...resolveCardiacStructureIds(
            CARDIAC_STRUCTURES,
            enabled,
            groups,
            { hiddenIds, isolatedIds },
            CARDIAC_SELECTORS,
          ),
        ].filter(
          (id) =>
            !arterial || cardiacMetadataById.get(id)?.category !== "artery",
        ),
      ),
    [enabled, groups, hiddenIds, isolatedIds, arterial],
  );
  useEffect(() => {
    const id = useViewerStore.getState().hoveredId;
    if (
      cardiacMetadataById.has(id ?? "") &&
      (!visible.has(id!) || opacity === 0)
    )
      useViewerStore.getState().hover(null);
    invalidate();
  }, [visible, opacity, invalidate]);
  return enabled
    ? CARDIAC_ASSETS.filter((a) =>
        a.structureIds.some((id) => visible.has(id)),
      ).map((a) => (
        <CardiacBoundary key={a.id} asset={a} retry={retry}>
          <Suspense fallback={null}>
            <CardiacAsset asset={a} visible={visible} />
          </Suspense>
        </CardiacBoundary>
      ))
    : null;
}
