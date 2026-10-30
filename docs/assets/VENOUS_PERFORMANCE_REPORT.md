# Venous performance and full-story verification

Story: enable Layer 04 → fetch only eligible same-origin regional GLBs → map
canonical source IDs → render/pick/filter/isolate → restore prior anatomy.
This is a static Vite app; there is no venous API, database or external runtime
supplier call. Optional asset base URL defaults to empty/same-origin. Production
hosting and environment configuration are unchanged.

## Asset / implementation baseline

Six lossless Meshopt GLBs, 667,750 triangles, 287 accepted source meshes. Exact
compressed/decoded bytes and SHA-256 are in the manifest. No venous model is
requested on initial skeletal-only load; all six are eligible for whole-body
venous viewing. Group/depth/region/visibility filters narrow requests before
loading. Regional suspension permits progressive arrival, not a fabricated
coarse LOD. Cached source geometries are reused; locally owned materials dispose
on unmount/change. Demand rendering has no new permanent frame subscription.

Source topology is unchanged; frustum culling is retained. There are no texture
downloads. Geometry compression is verified by exact decode roundtrip. No lossy
decimation, quantization, endpoint fabrication, BVH or LOD improvement is claimed.

## Measured browser results

Measured 2026-10-30 using Playwright Chromium, the production Vite build served
locally on port 4174, one worker, reduced motion, 1440 × 1050 viewport and DPR 1.
These are local smoke-test measurements, not representative hardware benchmarks.

- Initial skeletal-only page: **zero** venous requests.
- Enable venous-only whole body: six regional requests, **727 ms** from checkbox
  interaction to 133 draws. Localhost timing does not predict public delivery.
- Visible veins: **132 entity draws + one grid**, **667,752 triangles** including
  the two-triangle grid; 182 renderer geometries (includes cached skeleton),
  three existing textures and four shader programs.
- After focus, hover/pick, hide, drainage trace, context restoration, opacity,
  material mode and classification-filter cycles: **the same 182 geometries,
  three textures, four programs and six total asset requests**. No new venous
  texture downloads or duplicate regional requests occurred.
- Frames stayed unchanged across a 500 ms idle observation after a 350 ms
  settling period. Demand rendering does not continuously request new frames.
- All 16 combinations of the four global layers had exact expected triangle
  totals. Returning to bones restored the original 50 draws / 513,166 triangles
  including the grid; skull rendering code and source assets are unchanged.
- A deliberately aborted thorax GLB produced a localized venous-region error;
  retry recovered the region without disabling the skeletal layer.
- A separate 390 × 844 browser viewport smoke test enabled veins through the
  mobile navigation, opened the inspector, changed the display mode and verified
  that controls were reachable without horizontal page overflow. This is a
  responsive-layout check, not a physical mobile-GPU benchmark.
- Hover/click selected the real superior vena cava mesh. Hiding it removed its
  raycast target. Zero venous opacity left only the grid draw. Tracing the portal
  reference route framed its available geometry, with the hepatic transition
  listed only as a concept, and restoring returned the previous hidden/isolation
  state.

The reproducible checks are in `apps/web/e2e/venous.spec.ts`; diagnostic values
are attached to the first test as JSON. The browser's inter-frame interval during
on-demand interaction is **not** an FPS measurement and is not reported as one.

## Practical budgets and limits

- Initial load: 0 venous GLB requests.
- Fully visible venous layer: at most 132 source-entity draws plus the grid,
  667,750 vessel triangles; only the groups actually shown are raycast targets.
- Toggle/filter cycles: no duplicate downloads for cached unchanged assets and
  no increasing live geometry count after the initial upload.
- Idle: no continuing frame requests after interaction settles.
- HTTP failure: only the failed venous region is retried; bones remain usable.

No representative mobile GPU or physical-device peak-memory profiling has yet
been performed. Browser diagnostics expose renderer geometries/programs/textures,
not reliable process/GPU peak bytes. Source geometry already carries publisher
99%-reduction limitations; mobile LODs need separate measured design and review.
The app's existing >500 kB JavaScript chunk warning remains; metadata adds to the
main catalog bundle and future splitting is a separate performance task.
