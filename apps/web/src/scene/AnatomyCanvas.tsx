import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef, type ComponentRef } from "react";
import { useTranslation } from "react-i18next";
import { Box3, PerspectiveCamera, Sphere, Vector3, PCFShadowMap } from "three";
import {
  SKELETON_ASSET,
  MUSCLE_ASSET,
  SKULL_BONE_MAPPINGS,
  SKELETAL_PART_MAPPINGS,
  NERVOUS_FOCUS_TARGETS,
  NERVOUS_REGION_BOUNDS,
  VENOUS_GEOMETRY,
  brainRegionById,
  CARDIAC_GEOMETRY,
  cardiacMetadataById,
} from "@anatomy/data";
import { SkeletonModel } from "./SkeletonModel";
import { MuscleLayer } from "./MuscleLayer";
import { NervousLayer } from "./NervousLayer";
import { VenousLayer } from "./VenousLayer";
import { CardiacAnatomyModule } from "./CardiacAnatomyModule";
import { heartEn, heartRo } from "../localization/heart";
import { SceneDiagnostics } from "./SceneDiagnostics";
import { useViewerStore } from "../store/viewerStore";
import {
  SKULL_KEY_POSITION,
  SKULL_SHADOW_FRUSTUM,
  SKULL_SHADOW_SIZE,
} from "./skullShadow";

function boundsBox(bounds: {
  min: readonly number[];
  max: readonly number[];
}): Box3 {
  return new Box3(new Vector3(...bounds.min), new Vector3(...bounds.max));
}
const bodyBounds = boundsBox(SKELETON_ASSET.bounds);
const bodyCenter = bodyBounds.getCenter(new Vector3());

function CameraController() {
  const { camera, invalidate, size } = useThree();
  const command = useViewerStore((state) => state.cameraCommand);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const destination = useRef(camera.position.clone());
  const target = useRef(bodyCenter.clone());
  const animating = useRef(false);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const state = useViewerStore.getState();
    let bounds = bodyBounds.clone();
    if (command.view === "focus") {
      const focusStructures = [
        ...SKELETON_ASSET.structures,
        ...SKULL_BONE_MAPPINGS,
        ...SKELETAL_PART_MAPPINGS,
        ...MUSCLE_ASSET.structures,
        ...NERVOUS_FOCUS_TARGETS,
        ...VENOUS_GEOMETRY,
        ...CARDIAC_GEOMETRY,
      ];
      const selected = focusStructures.find(
        (item) => item.id === state.selectedId,
      );
      const regionStructures = focusStructures.filter(
        (item) =>
          item.regionId === state.activeRegionId &&
          (item.id.startsWith("cardiac-")
            ? state.cardiacEnabled
            : item.id.startsWith("venous-")
              ? state.activeSystemIds.has("venous")
              : item.id.startsWith("nervous-")
                ? state.activeSystemIds.has("nervous")
                : item.id.startsWith("muscle-")
                  ? state.activeSystemIds.has("muscular")
                  : state.activeSystemIds.has("skeletal")),
      );
      const traced = focusStructures.filter((item) =>
        state.venousTraceIds.has(item.id),
      );
      if (
        state.cardiacSelectedIds.size &&
        cardiacMetadataById.has(state.selectedId ?? "")
      )
        bounds = CARDIAC_GEOMETRY.filter((p) =>
          state.cardiacSelectedIds.has(p.id),
        ).reduce((box, p) => box.union(boundsBox(p.bounds)), new Box3());
      else if (
        state.venousTraceIds.has(state.selectedId ?? "") &&
        traced.length
      )
        bounds = traced.reduce(
          (box, item) => box.union(boundsBox(item.bounds)),
          new Box3(),
        );
      else if (
        state.brainSelectedIds.size &&
        (state.selectedId === "nervous-brain" ||
          brainRegionById.has(state.selectedId ?? ""))
      )
        bounds = focusStructures
          .filter((item) => state.brainSelectedIds.has(item.id))
          .reduce((box, item) => box.union(boundsBox(item.bounds)), new Box3());
      else if (
        state.selectedId === "cardiac-heart" ||
        state.selectedId?.startsWith("cardiac-valve-")
      ) {
        const parts = CARDIAC_GEOMETRY.filter((p) =>
          state.selectedId === "cardiac-heart"
            ? p.category !== "artery"
            : `cardiac-valve-${p.valve}` === state.selectedId,
        );
        if (parts.length)
          bounds = parts.reduce(
            (box, p) => box.union(boundsBox(p.bounds)),
            new Box3(),
          );
      } else if (selected) bounds = boundsBox(selected.bounds);
      else if (regionStructures.length)
        bounds = regionStructures.reduce(
          (box, item) =>
            box.union(
              boundsBox(NERVOUS_REGION_BOUNDS.get(item.id) ?? item.bounds),
            ),
          new Box3(),
        );
    }
    const sphere = bounds.getBoundingSphere(new Sphere());
    target.current.copy(sphere.center);
    const verticalFov = (camera.fov * Math.PI) / 180;
    const horizontalFov =
      2 * Math.atan((Math.tan(verticalFov / 2) * size.width) / size.height);
    const extent = bounds.getSize(new Vector3());
    const sideView = command.view === "left" || command.view === "right";
    const distance =
      command.view === "focus"
        ? Math.max(
            0.18,
            (sphere.radius /
              Math.sin(Math.min(verticalFov, horizontalFov) / 2)) *
              1.16,
          )
        : Math.max(
            extent.y / (2 * Math.tan(verticalFov / 2)),
            (sideView ? extent.z : extent.x) /
              (2 * Math.tan(horizontalFov / 2)),
          ) *
            1.23 +
          (sideView ? extent.x : extent.z) / 2;
    const direction = new Vector3(0, 0, 1);
    if (command.view === "back") direction.set(0, 0, -1);
    if (command.view === "left") direction.set(1, 0, 0);
    if (command.view === "right") direction.set(-1, 0, 0);
    if (command.view === "focus" && controls.current)
      direction.copy(camera.position).sub(controls.current.target).normalize();
    destination.current
      .copy(sphere.center)
      .addScaledVector(direction, distance);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camera.position.copy(destination.current);
      controls.current?.target.copy(target.current);
      controls.current?.update();
    } else animating.current = true;
    invalidate();
  }, [camera, command, invalidate, size.width, size.height]);

  useFrame((_, delta) => {
    if (!animating.current) return;
    const alpha = 1 - Math.exp(-9 * Math.min(delta, 0.05));
    camera.position.lerp(destination.current, alpha);
    controls.current?.target.lerp(target.current, alpha);
    controls.current?.update();
    if (camera.position.distanceTo(destination.current) < 0.001) {
      camera.position.copy(destination.current);
      controls.current?.target.copy(target.current);
      animating.current = false;
    }
    invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      target={bodyCenter}
      enableDamping
      dampingFactor={0.1}
      minDistance={0.12}
      maxDistance={8}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI - 0.15}
      onStart={() => {
        animating.current = false;
      }}
      onChange={() => invalidate()}
    />
  );
}

export function AnatomyCanvas() {
  const { t, i18n } = useTranslation();
  const cardiac = useViewerStore((state) => state.cardiacEnabled);
  const muscular = useViewerStore((state) =>
    state.activeSystemIds.has("muscular"),
  );
  const nervous = useViewerStore((state) =>
    state.activeSystemIds.has("nervous"),
  );
  const venous = useViewerStore((state) => state.activeSystemIds.has("venous"));
  return (
    <Canvas
      role="img"
      aria-label={
        cardiac
          ? i18n.language === "ro"
            ? heartRo.viewerLabel
            : heartEn.viewerLabel
          : t(
              venous
                ? "venous.viewerLabel"
                : nervous
                  ? "nervous.viewerLabel"
                  : muscular
                    ? "muscles.viewerLabel"
                    : "viewer.label",
            )
      }
      frameloop="demand"
      shadows={{ type: PCFShadowMap, autoUpdate: false }}
      dpr={[1, 1.75]}
      camera={{
        position: [bodyCenter.x, bodyCenter.y, 3.8],
        fov: 36,
        near: 0.01,
        far: 30,
      }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
      onPointerMissed={() => useViewerStore.getState().select(null)}
    >
      <color attach="background" args={["#07111d"]} />
      <ambientLight intensity={1.15} />
      <hemisphereLight args={["#e2f3ff", "#6b6459", 1.6]} />
      <directionalLight
        position={SKULL_KEY_POSITION}
        intensity={2.2}
        color="#fff5dc"
        castShadow
        shadow-mapSize={[SKULL_SHADOW_SIZE, SKULL_SHADOW_SIZE]}
        shadow-camera-left={SKULL_SHADOW_FRUSTUM.left}
        shadow-camera-right={SKULL_SHADOW_FRUSTUM.right}
        shadow-camera-top={SKULL_SHADOW_FRUSTUM.top}
        shadow-camera-bottom={SKULL_SHADOW_FRUSTUM.bottom}
        shadow-camera-near={SKULL_SHADOW_FRUSTUM.near}
        shadow-camera-far={SKULL_SHADOW_FRUSTUM.far}
        shadow-normalBias={0.00015}
        shadow-bias={-0.00002}
        shadow-radius={2}
      />
      <directionalLight
        position={[-2, 1.5, -2]}
        intensity={1.2}
        color="#81b6c9"
      />
      <Suspense fallback={null}>
        <SkeletonModel />
      </Suspense>
      <MuscleLayer />
      <NervousLayer />
      <VenousLayer />
      <CardiacAnatomyModule />
      <Grid
        position={[0, SKELETON_ASSET.bounds.min[1] - 0.008, 0]}
        args={[5, 5]}
        cellSize={0.1}
        cellThickness={0.45}
        cellColor="#173248"
        sectionSize={0.5}
        sectionThickness={0.7}
        sectionColor="#214152"
        fadeDistance={4}
        fadeStrength={1.5}
        infiniteGrid
      />
      <CameraController />
      <SceneDiagnostics />
    </Canvas>
  );
}
