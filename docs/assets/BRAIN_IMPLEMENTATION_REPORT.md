# Brain coloring implementation report

Branch: `feat/brain-anatomical-coloring` from `75a341f`, preserving the venous
integration and logo. Original reference models and 5180 evaluation unchanged.

## Implemented subset

- Geometry audit: 53 existing source-identified parts / 300,026 triangles, including
  23 left/right pairs and seven central source parts. No model rebuild/import.
- Three skull-style primary mode cards: Natural, source Regions, Advanced Atlas.
  Advanced is a clearly blocked candidate-inspection view retaining Natural
  geometry/material appearance. **Advanced atlas datasets integrated: zero.**
- Partial hierarchy, native group checkboxes/indeterminate state, left/right and
  paired selection, arbitrary multi-selection, matching homologue selection,
  RO/EN/Latin/FMA search, labeled source-category colors and three default palettes.
- Canonical-ID custom colors/opacity with versioned source-bound persistence,
  selection-only/all reset, reversible isolation and explicit hide/show/focus.
  Independent source-region hover/click/double-click; zero opacity is not pickable.
- Existing material identity is restored in unmodified Natural. Cached geometry
  is reused and only locally owned changed materials are disposed. Peripheral
  neural rendering, skull modes and other systems keep their previous behavior.
- Preparation commands produce blocked jobs for DK, Destrieux, HCP-MMP1.0 and
  Yeo 7/17. Correspondence, licensing and independent-review gates fail closed.

## Not implemented / not claimed

No accepted detailed cortical atlas, generic NIfTI/GIFTI/CIFTI/annot decoding,
cortical registration algorithm, reviewed label transfer, exact functional map,
bilateral cerebellar subdivision, missing nucleus reconstruction, cutting/capping
or MR/CT data. Frontal/parietal/temporal cortex groups are partial, not whole lobes.
Whole source occipital/insula/cerebellar surfaces are not subdivided fictitiously.

Current blockers are missing same-subject cortical/MRI/spherical correspondence,
exact permitted atlas files, independent mapping/terminology review and measured
registration evidence. The preparation plans document inputs and review stages;
they do not pretend that segmentation has already been completed.

## Verification

Typecheck, lint, formatting, 118 unit/material/UI tests, decoded geometry audit,
anatomy/i18n validators and the production build pass. Seven targeted browser
tests pass: the two new brain flows, the existing nervous interaction/cache flow
and four venous flows, including all 16 global layer combinations. Additional
unit coverage checks nested brain/venous restoration without changing the
existing venous/nervous restore priorities. No old visual goldens are updated.
Targeted test story: inspector → canonical source-ID state → shared source buffers
→ reversible materials/picking/visibility. This static Vite feature has no API,
database, external atlas runtime call or required environment-variable change.

### Measured local evidence (2026-10-30)

Playwright Chromium, one worker, production build on localhost, 1440 × 1050,
DPR 1 and reduced motion. Brain-only: **54 draws** (53 source parts + grid),
**300,028 triangles** (includes grid), 54 renderer geometries, three existing
textures and two programs. Source-mode/color/opacity/picking cycles did not add
geometries. Restoring the broader nervous context uploaded 42 previously unseen
in-frustum peripheral buffers once (96 geometries); repeated mode changes held
that count stable. This is expected lazy GPU upload, not a brain mesh clone.

Natural → Regions → Natural produced byte-identical canvas screenshots to the
initial Natural image; unregistered Atlas retained that same image. Atlas native
resource requests: **zero**. A 500 ms idle observation after 350 ms settling had
no additional frames. Real superior-frontal mesh hover/click and zero-opacity
non-picking were verified. The existing full nervous layer still reports 303
draws / 1,492,110 triangles, and venous-only remains 133 / 667,752 with the grid.

At 390 × 500, mobile panel navigation, mode selection and horizontal-overflow
checks pass. This is emulation, not a physical mobile-GPU or peak-memory benchmark.
No FPS claim is made from demand-render inter-frame intervals. The existing
large-JS-chunk build warning remains. Preview PNGs total 69,068 bytes and are
requested as ordinary UI images only while nervous controls are active; no new
3D texture or atlas model is loaded at startup.

Preview SHA-256 (BodyParts3D rendered derivatives):

- Natural: `034f6dffec0ef2401b076e109fe58cfe14f515482f3669cc8ecb14993ee6f18c`.
- Regions: `d01d5d438b092fc08836773a1b6eb7b9d06b7c7aeafa330bca87990498c84918`.

## Main files

`packages/anatomy-core/src/brain.ts`, `packages/anatomy-data/src/brain.ts`,
`apps/web/src/store/brainState.ts`, `BrainExplorer.tsx`, `BrainDetails.tsx`,
`BrainRegion.tsx`, `brainMaterials.ts`; additive nervous/inspector/camera wiring,
RO/EN strings/CSS, unit/browser tests, audit/preparation tools, reports and previews.

## Next step

Choose and acquire one exact licensed cortical atlas/reference pair, obtain
the target-subject registration data or approve an explicitly separate reference,
then implement native decoding and correspondences offline. A neuroanatomical
reviewer must approve region boundaries and measured registration before enabling
real Advanced Atlas coloring. Buying a visually detailed mesh alone does not
create a valid parcel-to-surface correspondence.
