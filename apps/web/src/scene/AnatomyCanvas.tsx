import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef, type ComponentRef } from "react";
import { useTranslation } from "react-i18next";
import { Box3, PerspectiveCamera, Sphere, Vector3, PCFShadowMap } from "three";
import {
  SKELETON_ASSET,
  MUSCLE_ASSET,
  SKULL_BONE_MAPPINGS,
} from "@anatomy/data";
import { SkeletonModel } from "./SkeletonModel";
import { MuscleLayer } from "./MuscleLayer";
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
        ...MUSCLE_ASSET.structures,
      ];
      const selected = focusStructures.find(
        (item) => item.id === state.selectedId,
      );
      const regionStructures = focusStructures.filter(
        (item) =>
          item.regionId === state.activeRegionId &&
          (item.id.startsWith("muscle-")
            ? state.activeSystemIds.has("muscular")
            : state.activeSystemIds.has("skeletal")),
      );
      if (selected) bounds = boundsBox(selected.bounds);
      else if (regionStructures.length)
        bounds = regionStructures.reduce(
          (box, item) => box.union(boundsBox(item.bounds)),
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
  const { t } = useTranslation();
  const muscular = useViewerStore((state) =>
    state.activeSystemIds.has("muscular"),
  );
  return (
    <Canvas
      role="img"
      aria-label={t(muscular ? "muscles.viewerLabel" : "viewer.label")}
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
