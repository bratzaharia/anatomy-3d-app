# Brain source-region coloring architecture

Branch: `feat/brain-anatomical-coloring`, from local preview `75a341f`. No merge,
push or deployment; the evaluation worktree on 5180 stays unchanged.

The audit preceded rendering changes. `brain-geometry-audit.json` pins the original
nervous GLB and each region's decoded position/index hashes, bounds and topology.
There are 53 separately identified source nodes / 300,026 triangles, not one
unlabelled brain shell. They can be styled by existing canonical anatomy IDs.
They are NOT a DK, Destrieux, HCP or Yeo parcellation. No buffers, coordinates,
normals, original GLTF materials, skull geometry or other anatomical assets change.

## Runtime contracts

- `packages/anatomy-data/src/brain.ts`: a presentation tree over existing source
  identities. No duplicate anatomy catalog entries. Partial cortical groups are
  explicitly named partial. Ambiguous cross-lobar/limbic gyri remain separate.
- `packages/anatomy-core/src/brain.ts`: selection semantics and a fail-closed
  future atlas-evidence gate. This gate is necessary, not sufficient, for future
  integration: actual label-buffer and neuroanatomical validation still required.
- `brainState.ts`: independent selection, styles, opacity and isolation snapshot.
  Group checkboxes affect only their applicable members. Other layers' settings
  are not changed by choosing colors, palettes or atlases. Explicit isolation
  temporarily masks other geometry and restores the original visibility sets.
- `BrainRegion.tsx`: only the audited source nodes opt in. Original source buffers
  are reused, frustum culling and central nervous/global visibility stay active.
  Invisible / zero-opacity surfaces are not raycast targets. Peripheral nerves
  continue through the original `Nerve` renderer and existing materials.
- Natural uses the exact existing CNS material when unmodified/unselected. Colors
  are ignored in Natural and unavailable Atlas views; selection highlighting and
  independently requested opacity remain temporary controls. Reset styles removes
  selected/all per-region color and opacity overrides without changing other layers.
- Color changes allocate at most one locally owned material per styled source
  node, not geometry clones. Superseded materials dispose. Cached source buffers
  remain loader-owned. No new permanent frame loop or custom shader program.

## UI and persistence

The right inspector has three native radio cards, using the skull card classes
without changing skull behavior. Thumbnails are captures of these exact source
parts, not invented atlas boundaries. Advanced Atlas repeats the Natural preview
and displays a registration warning; it never depicts nonexistent parcels.
The expandable tree includes source-ID/Latin/RO/EN search, indeterminate group
selection, existing homologues and a labeled legend. Regions absent from the
source are shown as gaps, not selectable fictional surfaces.

Only valid canonical-ID color/opacity overrides and palette preferences persist
under a versioned, target-SHA-bound browser key. Unknown IDs, malformed colors,
non-finite opacity and changed source versions are rejected. Natural is the
startup mode; no selections, other-layer visibility or atlas data are persisted.

## Future atlas boundary

`pnpm brain:prepare-atlas` generates five blocked preparation jobs. It does not
download, segment, align, approve or publish anything. Native format decoders,
source licensing, reference-template acquisition, cortical correspondence and
independent validation must precede any runtime atlas import. Do not reuse body
alignment landmarks as cortical registration evidence or use nearest coordinates
to transfer sulcal/functional boundaries.
