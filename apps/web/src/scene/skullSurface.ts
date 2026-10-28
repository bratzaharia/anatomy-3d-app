import { ShaderChunk, type MeshStandardMaterial } from "three";

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

// Simple-only finish. This is optical shading, not new anatomical detail.
export const SKULL_SIMPLE_SURFACE = {
  indirectLightGain: 0.2,
  grainFrequency: 1600,
  grainHeightMeters: 0.000025,
  shadowNormalBiasScale: 0.55,
} as const;

export function configureSkullSurface(
  material: MeshStandardMaterial,
  surface: boolean,
  hovered: boolean,
  natural = false,
): void {
  const finish = natural ? SKULL_SIMPLE_SURFACE : SKULL_SURFACE;
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
      if (natural) {
        // Tighten existing mesh-to-mesh contacts without moving vertices,
        // changing the shared shadow target, or touching the Colored mode.
        const bias = "directionalLightShadows[ i ].shadowNormalBias";
        if (!ShaderChunk.shadowmap_vertex.includes(bias))
          throw new Error("Natural skull shadow shader hook is unavailable");
        shader.vertexShader = shader.vertexShader.replace(
          "#include <shadowmap_vertex>",
          ShaderChunk.shadowmap_vertex.replace(
            bias,
            `(${bias} * ${SKULL_SIMPLE_SURFACE.shadowNormalBiasScale.toFixed(2)})`,
          ),
        );
      }
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\n" + surfaceFunctions)
        .replace(
          "#include <roughnessmap_fragment>",
          `#include <roughnessmap_fragment>
float skullGrainFade = 1.0 - smoothstep(0.5, 2.5, length(fwidth(vSkullSurfacePosition)) * ${finish.grainFrequency.toFixed(1)});
float skullGrain = skullNoise(vSkullSurfacePosition * ${finish.grainFrequency.toFixed(1)});
float skullCoarse = skullNoise(vSkullSurfacePosition * 450.0);
float skullHeight = (0.7 * skullGrain + 0.3 * skullCoarse) * ${finish.grainHeightMeters.toFixed(6)} * skullGrainFade;
roughnessFactor = clamp(roughnessFactor + (skullGrain - 0.5) * 0.08 * skullGrainFade, 0.45, 0.85);
diffuseColor.rgb *= 1.0 + (skullGrain - 0.5) * ${natural ? "0.018" : "0.035"} * skullGrainFade;`,
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
reflectedLight.indirectDiffuse *= ${finish.indirectLightGain.toFixed(2)};${
            natural
              ? `
// Keep the studio's light/shadow modelling, soften its yellow/blue color cast.
vec3 skullLuma = vec3(0.2126, 0.7152, 0.0722);
reflectedLight.directDiffuse = mix(reflectedLight.directDiffuse, vec3(dot(reflectedLight.directDiffuse, skullLuma)), 0.35);
reflectedLight.indirectDiffuse = mix(reflectedLight.indirectDiffuse, vec3(dot(reflectedLight.indirectDiffuse, skullLuma)), 0.50);`
              : ""
          }`,
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
    natural
      ? `skull-natural-v1:surface=${Number(surface)}:hover=${Number(hovered)}:${JSON.stringify(SKULL_SIMPLE_SURFACE)}`
      : `skull-studio-v2:surface=${Number(surface)}:hover=${Number(hovered)}:${JSON.stringify(SKULL_SURFACE)}`;
}
