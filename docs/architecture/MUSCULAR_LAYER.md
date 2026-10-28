# Additive muscular layer

Status: functional whole-body **partial coverage**, not an anatomically complete or independently medically reviewed milestone. See [computed coverage](../assets/MUSCLE_COVERAGE.md) and [asset audit](../assets/MUSCLE_AUDIT.md).

The skeleton GLB, skeletal manifest and `SkeletonModel.tsx` remain byte-identical to the recorded SHA-256 baseline. Bone identities, materials, transforms and renderer are untouched. The initial bones-only view is preserved. `STRUCTURES` remains the skeletal compatibility export; shared search, inspection and validation use `ANATOMY_CATALOG` (bones plus all muscular inventory entries, including unavailable entries).

`SYSTEMS` drives independent checkboxes and derived All behavior. Available systems currently are skeletal and muscular; future registrations extend the same list. An empty selection is valid. A disabled category cannot be activated through the store. Filters never issue camera commands. Locale changes affect labels only.

One WebGL2/R3F canvas contains the original skeleton and the isolated `MuscleLayer`. The latter mounts on first enable, has its own loading/error/retry state, and keeps its decoded GLB and stable meshes after disabling. Retry clears only the muscular loader cache and remounts only its error boundary. A muscle failure does not replace the skeleton. No high-resolution regional assets are included or eagerly fetched; the only available muscular representation is the publisher's reduced-detail whole-body release. This is not a fabricated LOD.

Each source file has exactly one runtime owner. Named subdivisions of a single muscle can be assembled under that muscle's canonical ID; different muscles are never merged into an inseparable selection. Serial and intrinsic-hand sets retain explicitly grouped identities. Unavailable individual members link to the source set where one exists, without pretending to possess separate geometry.

Visibility precedence is: available geometry → union of globally enabled systems → explicit hidden IDs → isolation restriction. Group hide/show expands to its catalog member IDs; it does not change an implicit parent visibility flag. Show removes those explicit hides and exits isolation, but never enables a disabled global layer. Reveal group hides other muscles and restores that group; bone visibility is preserved. Restore visibility clears contextual hides/isolation across the viewer. Region selection frames a region; it does not filter the rest of the body. The explorer offers contextual depth categories, anatomical compartments and complete scrollable member lists, including missing entries.

Muscular materials are three locally owned shared instances (base, hover, selected), never borrowed bone materials. Opacity updates only those instances. Opaque muscles write depth; transparent muscles depth-test but do not write it. At zero opacity, rendering and hit testing are both disabled. Alpha sorting of many overlapping surfaces can produce conventional transparency artifacts; this is an inspection aid, not a volumetric or diagnostic rendering method. Hidden/off-layer muscles use a no-op raycast. Memoized per-entity boolean subscriptions prevent every mesh rerendering on pointer movement; unchanged hover IDs do not update the store.

Camera focus uses the selected entity's measured bounds. Bones-only region framing uses only the original bone bounds. The skeletal whole-body fit remains unchanged. Controls, lighting, scene scale and grid remain shared.

## Adding or replacing muscular assets

1. Audit the exact source version and per-asset license; do not infer permission from a repository-level label.
2. Extend `muscle-definition.mjs` and its versioned inventory. Preserve IDs; explicitly represent missing/partial/grouped entries and source disagreements.
3. Run `import-muscles.mjs` (or `--offline` with its ignored cache populated). It never invokes the skeletal importer. Raw originals stay in `.cache`, outside Git.
4. Verify reference-coordinate registration and review attachments/shape suitability. A compatible subject cannot be inferred merely because another dataset derives from BodyParts3D.
5. Run validators, tests, source review and visual checks. Do not clear the incomplete/review flags without appropriate inventory and medical review.

`VITE_MUSCLE_ASSET_BASE_URL` can prefix the manifest's model path with a static CDN/R2 origin. Serve the exact validated asset with suitable CORS and cache headers. There is no dependency on an anatomy service or a particular storage provider. A future high-detail regional asset must have its own manifest, budget and demand-loading policy.

Opt-in `?diagnostics` writes local renderer counters to the canvas data attribute after rendered frames; it does not request frames, send telemetry or alter the anatomical scene.

On constrained low-memory/low-core or coarse-pointer devices, the muscular layer temporarily caps DPR at 1 without changing geometry; disabling it restores the previous DPR. The measured software-renderer frame-rate target is not met. See the performance baseline before treating this as a weak-device release.
