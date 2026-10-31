# Arterial layer architecture — partial educational reference

Branch: `feat/layer-05-complete-arterial-system`, based on cardiac commit `a3561a9`.
Logical layer 05 uses the existing stable system ID `arterial`, now the fifth
primary checkbox. The cardiac organ is still independent, not another primary
system. No previous geometry, material, registration or skull mode is rebuilt.

## Implemented boundary

- `anatomy-core/arterial.ts`: renderer-independent filters, graph contracts and
  bounded upstream/downstream traversal.
- `anatomy-data/arterial.ts`: parsed source manifest, canonical records, coverage,
  citations and regional groups. Missing targets have no mesh or source code.
- `arterialState.ts`: independent modes, multiselection, colors, opacity and
  reversible exploration overrides.
- `ArterialSystemLayer.tsx`: lazy source GLBs and ID-based picking. No permanent
  animation loop, reconstructed tubes, geometry clones or patient-specific flow.
- `ArterialExplorer.tsx`: RO/EN modes, tree, facets, source details and gaps.

## Single ownership

The seven arteries already in `heart-manifest.json` retain their `cardiac-fma*`
IDs and original GLB. When arterial is enabled, only the arterial renderer owns
these meshes; cardiac rendering excludes them. Arterial filters/materials then
apply. Disabling arterial restores cardiac ownership if the organ/categories
remain enabled. The global catalog/asset registry never duplicates these IDs.

Visibility uses the central resolver followed by arterial facets: OR within a
facet, AND across facets. No groups or detail levels means no arteries; no side
selection means unrestricted. Hidden, isolated and zero-opacity meshes cannot
raycast. Group selection and visibility are separate operations. Tracing is an
explicit contextual reveal with a reversible snapshot; it does not alter other
systems' opacity or membership. Camera focus is user-triggered, not a mode effect.

## Loading contract

Default: 48 new major records plus 7 shared cardiac arteries. Named/fine source
packets load only after opting into their detail and region. Packets are lossless
Meshopt GLB, using application metres/Y-up. `VITE_ARTERIAL_ASSET_BASE_URL` and
the existing `VITE_CARDIAC_ASSET_BASE_URL` optionally prefix the same local URIs.
No R2 upload, Cloudflare-specific domain model, purchase or deployment is made.
Region packets combine named/fine records; separate fine-only packets and true
decimated LODs remain future work, not claimed as implemented.

The GLTF cache is page-lifetime bounded by these assets; loader-owned geometry is
not disposed by child meshes. Owned materials dispose on change/unmount. No
unbounded frame timer or material/geometry clone per click is introduced.

## Not implemented

Patient imaging import, centerlines, lumen/wall measurements, territory atlas
registration, flow simulation, clipping/capping, surgical physics, organ-supply
maps, full anatomical variants and certified medical review.
