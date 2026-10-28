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

## Additive muscular layer — 2026-10-27

Production build: application shell 926.86 kB (197.31 kB gzip), deferred 3D chunk 1,011.15 kB (271.16 kB gzip), CSS 17.02 kB (4.57 kB gzip). The catalog accounts for additional shell size; detailed source metadata could be further separated from the UI catalog. Three.js remains deferred. The chunk-size warning remains visible and has not been suppressed.

Muscular GLB: 41,167,792 bytes (37,649,825 gzip), 2,387,524 triangles, 355 runtime entities / 417 original element files, no asset textures. The original skeletal GLB remains 7,134,628 bytes with the same checksum. Only the skeleton downloads at initial load; the muscular asset downloads/decodes on first enable and remains cached through filter and locale changes. No higher-resolution regional assets exist in this release. No extra simplification, invented LOD, BVH or Draco was introduced.

Reproducible measurement: `pnpm test:e2e`, `muscle-performance.spec.ts`, production preview, Chromium 156, ANGLE Vulkan SwiftShader (software renderer), emulated desktop viewport 1440 × 960, DPR 1, reduced motion, serial GPU tests. This is **not** a physical-device or hardware-accelerated FPS claim. The browser's emulated user-agent reports Windows; the local workspace host is macOS. Warm local static serving is not a cold-network measurement.

| Measured state | Draw calls | Triangles (includes grid) | Renderer geometries | Renderer textures |
| -------------- | ---------: | ------------------------: | ------------------: | ----------------: |
| Bones only     |         30 |                   513,166 |                  30 |                 1 |
| Combined       |        385 |                 2,900,690 |                 385 |                 1 |
| All layers off |          1 |                         2 |              Cached |                 1 |

One production run measured 1,103 ms from enabling muscles to a rendered combined frame, zero new frames during a one-second idle sample, and stable 385 cached geometries after disable/enable. The five-step scripted orbit rendered 15 frames in 10,764 ms (~1.39 rendered frames/sec). The warm disable/enable measurement took 11,005 ms while the software renderer and control damping were busy; this includes frame/GPU scheduling and is not a pure store/filter CPU benchmark. These poor software-renderer interaction results explicitly fail the aspirational desktop/mobile frame-rate targets. Real-device profiling and a medically validated lower-cost representation remain release blockers for weak hardware.

Opt-in muscular raycast measurements during that run: 3,195 mesh raycast calls, 16.6 ms cumulative CPU time, 2.2 ms maximum single call. This does not include skeletal raycasting, GPU time or end-to-end pointer latency. The measured bottleneck does not justify adding BVH complexity to the muscular picking path at present. Three shared local muscular materials are allocated once; locale and opacity do not allocate per-mesh materials or alter bone materials.

Coarse-pointer/low-memory/low-core devices cap DPR at 1 only while the muscular layer is enabled, restoring the previous DPR when it is disabled. This is a conservative resolution adaptation, not proof that the mesh budget meets mobile targets. Default muscle opacity is 100%; transparent rendering can increase fill cost and has conventional alpha-sorting limits. Device-specific FPS, GPU memory, mobile thermal behavior and WebGL context recovery remain unverified.

The functional suite checks one request per anatomical asset across repeated toggles, exact camera preservation on filter/locale changes, real muscular hover/click, hidden hit-testing, zero-opacity restoration of bone-only pixels, skeletal-only/combined visual goldens, independent failure recovery and tablet navigation. Static visual goldens exclude localized HTML overlays; camera completion is awaited before capture. Test artifacts attach renderer measurements. `?diagnostics` adds local counters only and never forces a permanent frame loop.
