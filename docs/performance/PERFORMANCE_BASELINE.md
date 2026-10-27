# Performance baseline

## Environment

Recorded 2026-10-27 in the local development environment. Build outputs are captured by `pnpm build`; interactive GPU measurements require browser QA and must record the actual device, OS, browser, viewport, and throttling state.

## Implemented controls

- R3F `frameloop="demand"` with explicit invalidation during camera motion and controls.
- Device pixel ratio capped at 1.75.
- Lazy-loaded 3D viewer chunk.
- No postprocessing or permanent animation.
- Visibility is a pure Set-based calculation; hidden meshes stay cached with rendering and raycasting disabled.
- Shared catalog and memoized visibility resolution.

## Verified production build

`pnpm build` on 2026-10-27 produced:

| Output                       |    Minified |        Gzip |
| ---------------------------- | ----------: | ----------: |
| Application shell JavaScript |   424.79 kB |   132.91 kB |
| Lazy 3D viewer JavaScript    | 1,007.15 kB |   269.94 kB |
| CSS                          |    15.20 kB |     4.10 kB |
| BodyParts3D skeletal GLB     | 7,134.63 kB | 6,578.71 kB |

The viewer chunk is intentionally deferred but is large because it includes Three.js, R3F, and Drei. This is a measured optimization target for the next milestone; no arbitrary warning threshold was raised to hide it.

The imported asset has 513,164 triangles, 29 runtime selectable meshes, 202 source element files, and no textures. The uncompressed GLB baseline was 12,988,696 bytes; lossless Meshopt reduces it to 7,134,628 bytes (45.1% smaller). Transport gzip decreases from approximately 7.94 MB to 6.58 MB. Every source vertex/normal/index is preserved exactly through compression. No simplification, quantization, Draco, or KTX2 is applied.

Interactive geometry and source mapping were checked in the Codex in-app browser on the local macOS host at 1260 × 1045. Chromium Playwright also checks real raycast selection, hidden geometry exclusion, one GLB request across filter/locale changes, retry after a failed request, and tablet layout. These functional tests do not establish physical-device FPS, GPU memory, or a universal load-time guarantee.

FPS, GPU memory, and context recovery are intentionally not claimed without a reproducible browser measurement. Real-model targets are 60 FPS on mainstream desktops and at least 30 FPS on supported mid-range mobile hardware; these are targets, not measured guarantees.
