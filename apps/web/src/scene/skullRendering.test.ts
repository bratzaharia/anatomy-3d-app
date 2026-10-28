import { describe, expect, it } from "vitest";
import {
  MeshStandardMaterial,
  OrthographicCamera,
  ShaderLib,
  Vector3,
  BufferGeometry,
  Float32BufferAttribute,
  type WebGLRenderer,
} from "three";
import { SKELETON_ASSET } from "@anatomy/data";
import {
  configureSkullSurface,
  SKULL_SURFACE,
  SKULL_SIMPLE_SURFACE,
} from "./skullSurface";
import {
  SKULL_KEY_POSITION,
  SKULL_SHADOW_SIZE,
  skullShadowFrustum,
  skullShadowStatistics,
  recordSkullShadowDraw,
  resetSkullShadowFrame,
  requestSkullShadowUpdate,
} from "./skullShadow";

describe("skull-only studio shading and cached shadows", () => {
  it("keeps every skull/mandible bound inside a tightly fitted key-light shadow camera", () => {
    const frustum = skullShadowFrustum();
    const camera = new OrthographicCamera(
      frustum.left,
      frustum.right,
      frustum.top,
      frustum.bottom,
      frustum.near,
      frustum.far,
    );
    camera.position.set(...SKULL_KEY_POSITION);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    expect(SKULL_SHADOW_SIZE).toBe(1024);
    expect(frustum.right - frustum.left).toBeLessThan(0.4);
    expect(frustum.top - frustum.bottom).toBeLessThan(0.5);
    expect(frustum.near).toBeGreaterThan(0);
    for (const bone of SKELETON_ASSET.structures.filter(
      (item) => item.id === "skull" || item.id === "mandible",
    ))
      for (const x of [bone.bounds.min[0], bone.bounds.max[0]])
        for (const y of [bone.bounds.min[1], bone.bounds.max[1]])
          for (const z of [bone.bounds.min[2], bone.bounds.max[2]]) {
            const point = new Vector3(x, y, z).project(camera);
            expect(Math.abs(point.x)).toBeLessThan(1);
            expect(Math.abs(point.y)).toBeLessThan(1);
            expect(Math.abs(point.z)).toBeLessThan(1);
          }
  });
  it("uses object-space, distance-filtered grain and real normal/light shading without vertex displacement", () => {
    const material = new MeshStandardMaterial();
    configureSkullSurface(material, true, true);
    const shader = {
      uniforms: {},
      vertexShader: ShaderLib.standard.vertexShader,
      fragmentShader: ShaderLib.standard.fragmentShader,
    } as Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];
    material.onBeforeCompile(shader, {} as WebGLRenderer);
    expect(shader.vertexShader).toContain("vSkullSurfacePosition = position;");
    expect(shader.vertexShader).toContain("#include <project_vertex>");
    expect(shader.vertexShader).not.toContain("transformed +=");
    expect(shader.fragmentShader).toContain("fwidth(vSkullSurfacePosition)");
    expect(shader.fragmentShader).toContain(
      "normal = normalize(skullPerturbed)",
    );
    expect(shader.fragmentShader).toContain(
      "reflectedLight.indirectDiffuse *= 0.15;",
    );
    expect(shader.fragmentShader).toContain("gl_FragColor.rgb *= 0.75;");
    expect(shader.fragmentShader).toContain("#include <normal_fragment_maps>");
    expect(SKULL_SURFACE.grainHeightMeters).toBeLessThan(0.0001);
    const plain = {
      uniforms: {},
      vertexShader: ShaderLib.standard.vertexShader,
      fragmentShader: ShaderLib.standard.fragmentShader,
    } as typeof shader;
    configureSkullSurface(material, false, false);
    material.onBeforeCompile(plain, {} as WebGLRenderer);
    expect(plain.vertexShader).toBe(ShaderLib.standard.vertexShader);
    expect(plain.fragmentShader).toBe(ShaderLib.standard.fragmentShader);
    material.dispose();
  });
  it("reports actual shadow work separately, with explicit invalidation and no frame requests", () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(new Float32Array(18), 3),
    );
    geometry.setIndex([0, 1, 2, 3, 4, 5]);
    geometry.setDrawRange(3, 3);
    const before = skullShadowStatistics.draws;
    resetSkullShadowFrame();
    recordSkullShadowDraw(null, null, null, null, geometry);
    expect(skullShadowStatistics.frameDraws).toBe(1);
    expect(skullShadowStatistics.frameTriangles).toBe(1);
    resetSkullShadowFrame();
    expect(skullShadowStatistics.draws).toBe(before + 1);
    expect(skullShadowStatistics.frameDraws).toBe(0);
    const renderer = {
      shadowMap: { needsUpdate: false, autoUpdate: false },
    } as WebGLRenderer;
    requestSkullShadowUpdate(renderer);
    expect(renderer.shadowMap.needsUpdate).toBe(true);
    expect(renderer.shadowMap.autoUpdate).toBe(false);
    geometry.dispose();
  });
  it("scopes the finer ivory finish and tighter existing contacts to Simple only", () => {
    const compile = (natural: boolean) => {
      const material = new MeshStandardMaterial();
      configureSkullSurface(material, true, true, natural);
      const shader = {
        uniforms: {},
        vertexShader: ShaderLib.standard.vertexShader,
        fragmentShader: ShaderLib.standard.fragmentShader,
      } as Parameters<MeshStandardMaterial["onBeforeCompile"]>[0];
      material.onBeforeCompile(shader, {} as WebGLRenderer);
      const cacheKey = material.customProgramCacheKey();
      material.dispose();
      return { ...shader, cacheKey };
    };
    const simple = compile(true),
      colored = compile(false);
    expect(simple.fragmentShader).toContain("* 0.000025 * skullGrainFade");
    expect(simple.fragmentShader).toContain("indirectDiffuse *= 0.20;");
    expect(simple.fragmentShader).toContain("vec3 skullLuma");
    expect(simple.vertexShader).toContain(
      "(directionalLightShadows[ i ].shadowNormalBias * 0.55)",
    );
    expect(simple.vertexShader).not.toContain("transformed +=");
    expect(simple.fragmentShader).toContain("gl_FragColor.rgb *= 0.75;");
    expect(simple.cacheKey).not.toBe(colored.cacheKey);
    expect(SKULL_SIMPLE_SURFACE.grainHeightMeters).toBeLessThan(
      SKULL_SURFACE.grainHeightMeters,
    );
    expect(colored.fragmentShader).not.toContain("skullLuma");
    expect(colored.vertexShader).toContain("#include <shadowmap_vertex>");
  });
});
