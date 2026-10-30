# Cardiac implementation — initial authentic subset

Branch: `feat/heart-cardiac-venous-integration`, independent of the production
release in PR #3 and the untouched licensed-asset evaluation on port 5180.

Implemented: independent organ classification and visibility, 30 source parts in
three lazy packages, hierarchical source-category controls, partial selection,
multi-selection, conventional natural/category/connection modes, custom colors,
global and separate wall opacity, focus, hide/isolate/restore, uncapped geometric section and clipped
non-picking. UI text is RO/EN, source Latin terminology remains review-pending.
Source-based graph inspection and shared venous selectors reuse the current
canonical IDs, without duplicated vessels or fabricated continuity.
Existing venous details also expose a source-cited inflow route to the correct
atrial cavity, including curated upstream systemic drainage. An explicit reveal
enables the organ without adding a fifth primary-system checkbox.

Coverage is limited: three wall components, four cavity surfaces, eleven valve
leaflets/cusps, five papillary components and seven arterial components. Root/
valve selectors are aggregates, not extra anatomy. Four cavities are **not** four
complete independently segmented muscular chambers. No realistic tissue texture
or certified wall thickness is claimed.

Missing: complete walls/septa/ostia/cordae/annuli, surface landmarks and detailed
trabeculation, pericardial layers, smallest cardiac veins/selected tributaries,
conduction tissue, complete coronary branches/variants, exact vascular junctions,
validated cardiac/valve motion, flow animation, clinical section protocols and
advanced LODs. See the acquisition and medical-gate reports, not a placeholder
beating heart. The 14 explicit missing registry entries are an initial list, not
an exhaustive completeness metric.

Verification uses `pnpm validate:heart`, the full anatomy/i18n validators, types,
lint, formatting, unit/component/picking tests and cardiac browser scenarios.
Do not describe any check as passed before its actual run completes. Independent
medical approval and physical-device performance assessment remain pending.

No paid asset was purchased and no third-party license or agreement was accepted.
This feature branch is **not merged or deployed** by the preceding production
release request. A separate reviewed PR is needed before production inclusion.

Verification run: typecheck, lint, formatting, 127 unit/UI/picking/domain tests,
all anatomy validators (including 25 protected-file hashes and cardiac decoded
GLB checks), RO/EN validation of 1,506 catalog entries, and production build passed.
The pre-existing large-JS-bundle warning remains; cardiac geometry is lazy-loaded,
but metadata/UI add to the existing client bundle. Cardiac browser results are
recorded separately after the final browser run.

Final cardiac browser run: **4/4 passed**, including lazy package loading,
byte-identical natural-material restoration, picking/hide/zero-opacity/clipping,
regional failure/retry, narrow layout, and existing cava-to-right-atrium reveal.
After first activation the organ control remains accessible when both the heart
and venous layer are switched off. Additional regression runs passed 15 existing
atlas/brain/panel/skull/venous scenarios and 7 existing muscular/nervous scenarios.
These are targeted runs, not a claim of a new full Linux CI run for this branch.
The pre-existing platform-specific skull-card font golden was not rewritten.

Files span the new cardiac core/data registry, independent importer/validator,
three GLBs/attribution, dedicated state/renderer/picking/UI/localization/tests and
ten cardiac reports. Existing integration files receive only catalog/module/
selection/visibility connections and opt-in clipping capability; no earlier
geometry file or earlier anatomy manifest changes. Offline reimport reproduced
the same 30 parts, 124,482 triangles and 1,793,124 encoded bytes with pinned inputs.
