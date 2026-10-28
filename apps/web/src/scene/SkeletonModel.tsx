import { memo, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, type BufferGeometry } from "three";
import {
  SKELETON_ASSET,
  STRUCTURES,
  SKELETAL_STRUCTURES,
  SKULL_BONE_MAPPINGS,
} from "@anatomy/data";
import { resolveVisibleStructureIds } from "@anatomy/core";
import { useViewerStore } from "../store/viewerStore";
import {
  createSkullBoneMaterials,
  createSkullGeometryViews,
  validateSkullColorLayout,
} from "./skullMaterials";

const noRaycast: Mesh["raycast"] = () => undefined;
interface BoneMaterials {
  base: MeshStandardMaterial;
  selected: MeshStandardMaterial;
  hovered: MeshStandardMaterial;
}

const Bone = memo(function Bone({
  id,
  geometry,
  visible,
  materials,
}: {
  readonly id: string;
  readonly geometry: BufferGeometry;
  readonly visible: boolean;
  readonly materials: BoneMaterials;
}) {
  const selected = useViewerStore(
    (state) =>
      state.selectedId === id ||
      (id.startsWith("skull-") && state.selectedId === "skull"),
  );
  const hovered = useViewerStore((state) => state.hoveredId === id);
  return (
    <mesh
      name={id}
      geometry={geometry}
      visible={visible}
      material={
        selected
          ? materials.selected
          : hovered
            ? materials.hovered
            : materials.base
      }
      userData={{ anatomyId: id }}
      raycast={visible ? Mesh.prototype.raycast : noRaycast}
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

export function SkeletonModel() {
  const { scene } = useGLTF(SKELETON_ASSET.uri);
  const invalidate = useThree((state) => state.invalidate);
  const activeSystemIds = useViewerStore((state) => state.activeSystemIds);
  const hiddenIds = useViewerStore((state) => state.hiddenIds);
  const isolatedIds = useViewerStore((state) => state.isolatedIds);
  const visible = useMemo(
    () =>
      resolveVisibleStructureIds(SKELETAL_STRUCTURES, activeSystemIds, {
        hiddenIds,
        isolatedIds,
      }),
    [activeSystemIds, hiddenIds, isolatedIds],
  );
  const geometries = useMemo(() => {
    const registry = new Map<string, BufferGeometry>();
    scene.traverse((object) => {
      if (
        object instanceof Mesh &&
        typeof object.userData.anatomyId === "string"
      )
        registry.set(object.userData.anatomyId, object.geometry);
    });
    for (const structure of STRUCTURES)
      if (!registry.has(structure.id))
        throw new Error(`Model mapping missing: ${structure.id}`);
    validateSkullColorLayout(registry.get("skull")!);
    return registry;
  }, [scene]);
  const skullViews = useMemo(
    () => createSkullGeometryViews(geometries.get("skull")!),
    [geometries],
  );
  const skullMaterials = useMemo(
    () =>
      new Map([
        ...SKULL_BONE_MAPPINGS.map(
          (bone) =>
            [bone.id, createSkullBoneMaterials(bone.conceptId)] as const,
        ),
        ["mandible", createSkullBoneMaterials("FMA52748")] as const,
      ]),
    [],
  );
  const materials = useMemo(
    () => ({
      base: new MeshStandardMaterial({
        color: "#e5d8b8",
        roughness: 0.7,
        metalness: 0,
      }),
      selected: new MeshStandardMaterial({
        color: "#72d8cc",
        roughness: 0.58,
        metalness: 0,
        emissive: "#235f56",
        emissiveIntensity: 0.28,
      }),
      hovered: new MeshStandardMaterial({
        color: "#f7edcf",
        roughness: 0.6,
        metalness: 0,
        emissive: "#a58b45",
        emissiveIntensity: 0.1,
      }),
    }),
    [],
  );
  useEffect(() => {
    useViewerStore.setState({ assetStatus: "ready" });
    invalidate();
    return () => {
      Object.values(materials).forEach((material) => material.dispose());
      skullMaterials.forEach((set) =>
        Object.values(set).forEach((material) => material.dispose()),
      );
      skullViews.forEach(({ geometry }) => geometry.dispose());
    };
  }, [invalidate, materials, skullMaterials, skullViews]);
  useEffect(() => {
    const hoveredId = useViewerStore.getState().hoveredId;
    if (hoveredId && !visible.has(hoveredId))
      useViewerStore.getState().hover(null);
    invalidate();
  }, [invalidate, visible]);

  // GLTF belongs to the loader cache. Dispose only local draw-range views and
  // materials; changing filters/locale never decodes the GLB again.
  return (
    <group dispose={null}>
      {[
        ...[...geometries].filter(([id]) => id !== "skull"),
        ...skullViews.map(({ id, geometry }) => [id, geometry] as const),
      ].map(([id, geometry]) => (
        <Bone
          key={id}
          id={id}
          geometry={geometry}
          visible={visible.has(id)}
          materials={skullMaterials.get(id) ?? materials}
        />
      ))}
    </group>
  );
}
