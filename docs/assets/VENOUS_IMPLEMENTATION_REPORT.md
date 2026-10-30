# Venous Layer 04 implementation report

Branch: `feat/layer-04-complete-venous-system`.

## Implemented

- Independent fourth available system in the base app; skeletal compatibility
  catalog unchanged. BodyParts3D source surfaces only, not fictional geometry.
- Stable typed identities, RO/EN/Latin labels, exact source concepts and hashes,
  regional manifests, explicit coverage/review/representation distinctions.
- Six on-demand regional GLBs; filter-based loading, independent region failure
  boundaries/retry and configurable asset base URL.
- Global composable visibility, regional/classification facets, indeterminate
  “all” checkbox, search by names and real FMA IDs, source hover/click/double-click,
  focus, hide, isolate and Shift/Ctrl/Cmd additive vein selection.
- Four material modes, independent opacity, transparent vein material with
  disabled picking at zero opacity; reversible layer isolation and semantic
  reference drainage highlighting/list with conceptual hepatic transition.
- Source/license UI, explicit missing/sex-specific/quarantine notices; no claimed
  biological blue color, imaging, measured flow or clinical certification.
- Unit, UI, graph/visibility tests and independent decoded-GLB/protected-file
  validation. Browser verification and performance evidence are recorded in the
  performance report rather than inferred from empty fixtures.

## Partial / pending

The generated anatomical matrix is the authority for current counts and exact
gaps: 120 individual source entities, 12 grouped sets, 101 entries without
accepted geometry across 233 defined targets. These counts do not measure
clinical anatomical completeness. A sourced mesh is not a complete vessel course. All anatomy, translations,
trajectory connectivity, depth annotations and registration require qualified
review. Regions without geometry do not load placeholder vessels.

Only an OBJ import adapter exists today. Generic FBX/glTF source normalization,
multiple native LODs, automatically prefetched regional tiers, contextual
transparency of other anatomy, superior/inferior camera presets, full upstream
tributary-tree isolation, complete variants and microanatomy are not implemented.
No additional organ layer is fabricated for combined-layer testing.

## Blocked on source evidence / approval

Completing all small venous networks, correcting source-side conflicts, female
body integration and professional approval need accepted source material and
review. Paid assets need written WebGL redistribution/derivative rights and
owner approval before acquisition. No app extraction, purchase, new outreach,
production upload, merge or deployment occurred in this change.

## Main changed areas

- `packages/anatomy-core/src/venous.ts` and core export.
- `packages/anatomy-data/src/venous*`, central catalog/groups/coverage registration.
- `tools/anatomy-assets/import-venous.mjs`, curated definition and validator;
  optional material naming in the shared lossless packer preserves old defaults.
- `apps/web/src/scene/VenousLayer.tsx`, additive camera/scene integration.
- `apps/web/src/components/Venous*`, inspector/overlay/coverage integration;
  isolated viewer state and localized UI/CSS.
- New public regional assets/attribution, tests, and the seven venous documents.

There is no replacement of skeletal, skull, muscular or neural geometry/material
code. All 15 prior public model/manifest files are checksum-protected.
