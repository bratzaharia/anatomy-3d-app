import type { MeshStandardMaterial } from "three";

// Decorative material micrograin, not scanned anatomy or reconstructed pores.
// Object-space coordinates keep it attached to bone while orbiting. No UV,
// position, index, normal-buffer or anatomical-boundary changes are needed.
const surfaceFunctions = /* glsl */ `
varying vec3 vSkullSurfacePosition;
float skullHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float skullNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(skullHash(i), skullHash(i + vec3(1,0,0)), u.x),
        mix(skullHash(i + vec3(0,1,0)), skullHash(i + vec3(1,1,0)), u.x), u.y),
    mix(mix(skullHash(i + vec3(0,0,1)), skullHash(i + vec3(1,0,1)), u.x),
        mix(skullHash(i + vec3(0,1,1)), skullHash(i + vec3(1,1,1)), u.x), u.y), u.z);
}
`;

export const SKULL_SURFACE = {
  indirectLightGain: 0.15,
  grainFrequency: 1600,
  grainHeightMeters: 0.00008,
  hoverBrightness: 0.75,
} as const;

export function configureSkullSurface(
  material: MeshStandardMaterial,
  surface: boolean,
  hovered: boolean,
): void {
  material.onBeforeCompile = (shader) => {
    if (surface) {
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vSkullSurfacePosition;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvSkullSurfacePosition = position;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\n" + surfaceFunctions)
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
float skullGrainFade = 1.0 - smoothstep(0.5, 2.5, length(fwidth(vSkullSurfacePosition)) * ${SKULL_SURFACE.grainFrequency.toFixed(1)});
float skullGrain = skullNoise(vSkullSurfacePosition * ${SKULL_SURFACE.grainFrequency.toFixed(1)});
float skullCoarse = skullNoise(vSkullSurfacePosition * 450.0);
float skullHeight = (0.7 * skullGrain + 0.3 * skullCoarse) * ${SKULL_SURFACE.grainHeightMeters.toFixed(6)} * skullGrainFade;
roughnessFactor = clamp(roughnessFactor + (skullGrain - 0.5) * 0.08 * skullGrainFade, 0.45, 0.85);
diffuseColor.rgb *= 1.0 + (skullGrain - 0.5) * 0.035 * skullGrainFade;`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
vec3 skullDx = dFdx(-vViewPosition), skullDy = dFdy(-vViewPosition);
vec3 skullR1 = cross(skullDy, normal), skullR2 = cross(normal, skullDx);
float skullDet = dot(skullDx, skullR1);
vec3 skullPerturbed = abs(skullDet) * normal - sign(skullDet) * (dFdx(skullHeight) * skullR1 + dFdy(skullHeight) * skullR2);
if (dot(skullPerturbed, skullPerturbed) > 1e-24) normal = normalize(skullPerturbed);`,
        )
        .replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
reflectedLight.indirectDiffuse *= ${SKULL_SURFACE.indirectLightGain.toFixed(2)};`,
        );
    }
    if (hovered) {
      const marker = "#include <dithering_fragment>";
      if (!shader.fragmentShader.includes(marker))
        throw new Error("Skull hover output shader hook is unavailable");
      shader.fragmentShader = shader.fragmentShader.replace(
        marker,
        `${marker}\ngl_FragColor.rgb *= ${SKULL_SURFACE.hoverBrightness.toFixed(2)};`,
      );
    }
  };
  // All bone colors/selection uniforms share programs; X-ray skips surface work.
  material.customProgramCacheKey = () =>
    `skull-studio-v2:surface=${Number(surface)}:hover=${Number(hovered)}:${JSON.stringify(SKULL_SURFACE)}`;
}
