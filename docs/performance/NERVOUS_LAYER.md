# HA3DA-1 nervous layer — measured verification

Measured 2026-10-28/29 with Playwright Chromium 156, ANGLE Vulkan SwiftShader
(software rendering), 1440×960 viewport, DPR 1, reduced motion, one test worker.
These are reproducible local software-renderer measurements, not a hardware or
mobile frame-rate guarantee. The opt-in `?diagnostics` counters do not run normal
production raycast timing.

## Assets and steady-state resources

| View                        | Main draw calls | Main triangles, including grid |                             Geometries | Textures | Programs |
| --------------------------- | --------------: | -----------------------------: | -------------------------------------: | -------: | -------: |
| Existing skeleton           |              50 |                        513,166 |                                     50 |        3 |        4 |
| Existing skeleton + muscles |             405 |                      2,900,690 |                                    405 |        3 |        4 |
| Nervous layer alone         |              84 |                        342,862 | 133 cached after initial skeleton load |        3 |        4 |
| All three layers, warmed    |             488 |                      3,243,550 |                                    488 |        3 |        4 |

Nervous geometry adds 83 render entities assembled from 91 source meshes and
342,860 triangles. The lossless Meshopt GLB is 4,762,452 bytes (gzip 4,375,790).
Existing skeletal/muscular GLBs remain 7,134,628 / 41,167,792 bytes, unchanged.
No new textures, lights, shadow casters, render passes or continuous frame loops.
Four shared nervous materials are locally owned; loader-owned geometry remains
cached across layer toggles. GPU allocation bytes and process heap were not
measured; geometry/texture counts are resource counts, not a byte-memory claim.

The final local run measured **550 ms** from the nervous checkbox action to the
first frame with 84 main draws / 342,862 triangles, including local fetch/decode
and UI/test synchronization. This is not an internet/CDN download-time claim.

Existing skull self-shadow refresh adds 22 calls and 127,094 triangles only when
casters change. For example all-layer activation reports 510 total calls,
3,370,644 total triangles, then 488 / 3,243,550 on cached main-only frames. This
is the existing skull pass, not an additional nervous effect.

## Before/after interaction

Before integration, the existing muscle performance scenario measured 1,169 ms
enable-to-render, 14 orbit frames / 10,078 ms (1.389 FPS), 10,859 ms scripted warm
off/on round trip, and zero idle frames in one second. Muscle picking recorded
3,195 calls, 14.5 ms total, 0.7 ms maximum.

The full regression run after integration measured the same 405 calls,
2,900,690 triangles and cached resources with nervous disabled: 1,131 ms
enable-to-render, 14 orbit frames / 10,043 ms (1.394 FPS), 10,986 ms warm off/on,
zero idle frames. Muscle picking: 3,195 calls, 15.0 ms total, 0.8 ms maximum;
nervous asset requests and timed nervous raycasts remained zero.

With all three systems enabled, the same five-step scripted orbit measured
14 frames / 12,835 ms (1.091 FPS), zero idle frames in one second. Nervous picking
recorded 747 calls, 0.20 ms total, 0.10 ms maximum; muscle picking 3,195 calls,
14.3 ms total, 0.5 ms maximum. Whole-body bounds misses dominate many of these
raycasts, so these are scenario measurements, not a worst-case pick budget.

All-layer orbit is slower on this software renderer, consistent with the added
83 draws and 342,860 triangles. No unmeasured BVH/LOD architecture is introduced;
real-device profiling remains necessary before claiming mobile suitability.

## Regression evidence

- All eight system combinations, empty and All on/off, have exact expected
  main draw/triangle counts and preserve camera state.
- Nervous-only activation loads one GLB; three warm toggles and RO/EN switching
  do not refetch it. Initialization timing is logged by `nervous.spec.ts`.
- Real-triangle hover/click, focus, hide, isolation and facet composition pass.
  Hidden meshes cannot be picked; missing spinal geometry has disabled actions.
- Explicit Show nervous layer reveals otherwise occluded head geometry without
  changing global checkboxes or original bone/muscle materials. Restore returns
  exact prior hide/isolate overrides and nervous facets.
- Nervous 503/retry does not replace the skeleton or muscle scene.
- Skeleton image is byte-identical before/after all-layer toggles. Initial test
  failure was restricted to a composited overlay SVG reset icon; hiding overlay
  descendants in this new comparison fixed the capture, with zero bone pixel
  tolerance and no renderer change. Existing golden images were not replaced.
- Existing skull simple/colored/xray, 25% hover darkening, cached shadows,
  perspective and desktop/tablet panel tests pass unchanged.
- `validate-nervous.ts` verifies SHA-256 preservation of 14 protected skeletal,
  muscular and skull geometry/material/manifest/source files.

The only new visual golden is `nervous-brain-chromium.png`. It is a reduced,
partial source model, not a photorealistic or complete full-body neural scan.
